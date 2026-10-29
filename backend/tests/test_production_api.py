import io
import time
import pytest
import jwt
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.core.config import settings
from app.storage.mongo_store import mongo_store

TEST_SIGNING_KEY = "test-secret-key-32-chars-minimum-security"
client = TestClient(app)


def create_test_image_bytes(format="JPEG") -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (100, 100), color=(46, 125, 50))
    img.save(buf, format=format)
    return buf.getvalue()


def create_test_jwt(
    user_id: str,
    email: str = None,
    name: str = None,
    expired: bool = False,
    signing_key: str = TEST_SIGNING_KEY,
    omit_sub: bool = False,
) -> str:
    payload = {
        "exp": int(time.time() - 3600 if expired else time.time() + 3600),
    }
    if not omit_sub:
        payload["sub"] = user_id
    if email:
        payload["email"] = email
    if name:
        payload["name"] = name
    return jwt.encode(payload, signing_key, algorithm="HS256")


@pytest.fixture(autouse=True)
def setup_test_environment():
    orig_key = settings.CLERK_SECRET_KEY
    settings.CLERK_SECRET_KEY = TEST_SIGNING_KEY
    mongo_store.reset_mock_data()
    yield
    settings.CLERK_SECRET_KEY = orig_key


def test_auth_boundary_unauthenticated_rejected():
    """Unauthenticated requests to production routes must return 401."""
    # Dashboard
    resp = client.get("/api/v1/prod/dashboard")
    assert resp.status_code == 401
    assert "authentication required" in resp.json()["detail"].lower()

    # User profile
    resp = client.get("/api/v1/prod/user")
    assert resp.status_code == 401

    # Production scan
    image_bytes = create_test_image_bytes()
    resp = client.post(
        "/api/v1/prod/scan",
        files={"file": ("garment.jpg", image_bytes, "image/jpeg")},
    )
    assert resp.status_code == 401

    # Offers
    resp = client.get("/api/v1/prod/offers")
    assert resp.status_code == 401

    # Redeem
    resp = client.post("/api/v1/prod/offers/patagonia-worn-wear-10/redeem")
    assert resp.status_code == 401

    # History
    resp = client.get("/api/v1/prod/history")
    assert resp.status_code == 401


def test_client_supplied_headers_and_params_rejected():
    """Client-supplied user IDs or test headers without valid Bearer JWT must be rejected."""
    headers = {"X-Test-User-Id": "user_alice"}
    resp = client.get("/api/v1/prod/dashboard", headers=headers)
    assert resp.status_code == 401

    resp = client.get("/api/v1/prod/dashboard?user_id=user_alice")
    assert resp.status_code == 401


def test_malformed_auth_headers_rejected():
    """Malformed or invalid authorization headers must return 401."""
    # Missing Bearer prefix
    resp = client.get("/api/v1/prod/dashboard", headers={"Authorization": "Token abcdef"})
    assert resp.status_code == 401
    assert "invalid authorization header" in resp.json()["detail"].lower()

    # Bearer with empty token
    resp = client.get("/api/v1/prod/dashboard", headers={"Authorization": "Bearer"})
    assert resp.status_code == 401

    # Corrupted token string
    resp = client.get("/api/v1/prod/dashboard", headers={"Authorization": "Bearer not-a-valid-jwt"})
    assert resp.status_code == 401
    assert "invalid authentication token" in resp.json()["detail"].lower()


def test_invalid_signature_token_rejected():
    """Tokens signed with untrusted keys must be rejected."""
    forged_token = create_test_jwt("user_hacker", signing_key="untrusted-forged-key-32-bytes-long")
    resp = client.get(
        "/api/v1/prod/dashboard",
        headers={"Authorization": f"Bearer {forged_token}"},
    )
    assert resp.status_code == 401
    assert "invalid authentication token" in resp.json()["detail"].lower()


def test_expired_token_rejected():
    """Expired tokens must be rejected with 401."""
    expired_token = create_test_jwt("user_alice", expired=True)
    resp = client.get(
        "/api/v1/prod/dashboard",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert resp.status_code == 401
    assert "expired" in resp.json()["detail"].lower()


def test_missing_sub_claim_rejected():
    """Tokens without subject (sub) claim must be rejected."""
    token = create_test_jwt("user_alice", omit_sub=True)
    resp = client.get(
        "/api/v1/prod/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 401
    assert "missing 'sub'" in resp.json()["detail"].lower()


def test_verified_token_grants_access():
    """Cryptographically valid token grants access and correctly derives identity."""
    token = create_test_jwt("user_alice_clerk", email="alice@example.com", name="Alice Sustainable")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/prod/dashboard", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["user_id"] == "user_alice_clerk"
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["name"] == "Alice Sustainable"
    assert data["stats"]["current_points"] == 50
    assert len(data["recent_scans"]) == 0


def test_strict_data_isolation_between_users():
    """
    Ensure complete data isolation:
    User Alice's scans and points are strictly isolated from User Bob.
    """
    alice_token = create_test_jwt("user_alice_iso", email="alice@test.app", name="Alice")
    bob_token = create_test_jwt("user_bob_iso", email="bob@test.app", name="Bob")

    alice_headers = {"Authorization": f"Bearer {alice_token}"}
    bob_headers = {"Authorization": f"Bearer {bob_token}"}

    image_bytes = create_test_image_bytes()

    # Alice scans an organic tee
    scan_resp = client.post(
        "/api/v1/prod/scan",
        files={"file": ("tee.jpg", image_bytes, "image/jpeg")},
        data={"sample_hint": "organic-tee"},
        headers=alice_headers,
    )
    assert scan_resp.status_code == 200
    alice_scan = scan_resp.json()
    assert alice_scan["points_awarded"] > 0

    # Alice's dashboard shows 1 scan and updated points
    alice_dash = client.get("/api/v1/prod/dashboard", headers=alice_headers).json()
    assert alice_dash["stats"]["total_scans"] == 1
    assert alice_dash["stats"]["current_points"] == 50 + alice_scan["points_awarded"]
    assert len(alice_dash["recent_scans"]) == 1

    # Bob's dashboard shows 0 scans and only starting points (50)
    bob_dash = client.get("/api/v1/prod/dashboard", headers=bob_headers).json()
    assert bob_dash["stats"]["total_scans"] == 0
    assert bob_dash["stats"]["current_points"] == 50
    assert len(bob_dash["recent_scans"]) == 0

    # Bob's history is empty
    bob_hist = client.get("/api/v1/prod/history", headers=bob_headers).json()
    assert len(bob_hist["scans"]) == 0
    assert len(bob_hist["redeemed_offers"]) == 0


def test_production_persistence_and_offer_redemption():
    """Verify persistent wallet updates and offer redemption for verified user."""
    token = create_test_jwt("user_carol_wallet", email="carol@test.app")
    user_headers = {"Authorization": f"Bearer {token}"}

    # Carol starts with 50 points (Patagonia costs 50)
    offers_resp = client.get("/api/v1/prod/offers", headers=user_headers)
    assert offers_resp.status_code == 200
    offers = offers_resp.json()
    patagonia = next(o for o in offers if o["id"] == "patagonia-worn-wear-10")
    assert patagonia["is_unlocked"] is True

    # Carol redeems Patagonia
    redeem_resp = client.post(
        "/api/v1/prod/offers/patagonia-worn-wear-10/redeem",
        headers=user_headers,
    )
    assert redeem_resp.status_code == 200
    redemption = redeem_resp.json()
    assert redemption["points_spent"] == 50
    assert redemption["remaining_points"] == 0
    assert redemption["code"].startswith("PAT-WORN-")

    # Carol's wallet now has 0 points
    user_info = client.get("/api/v1/prod/user", headers=user_headers).json()
    assert user_info["wallet"]["current_points"] == 0
    assert user_info["wallet"]["total_points_spent"] == 50

    # Duplicate redemption rejected
    dup_resp = client.post(
        "/api/v1/prod/offers/patagonia-worn-wear-10/redeem",
        headers=user_headers,
    )
    assert dup_resp.status_code == 409

    # Insufficient points redemption rejected
    guppy_resp = client.post(
        "/api/v1/prod/offers/guppyfriend-wash-bag/redeem",
        headers=user_headers,
    )
    assert guppy_resp.status_code == 400


def test_preserved_test_build_endpoints_still_work():
    """Verify that unauthenticated test build endpoints continue to function."""
    resp = client.get("/api/v1/offers")
    assert resp.status_code == 200
    assert len(resp.json()) >= 4

    resp = client.get("/api/v1/history")
    assert resp.status_code == 200
    assert "stats" in resp.json()

    image_bytes = create_test_image_bytes()
    scan_resp = client.post(
        "/api/v1/scan",
        files={"file": ("tee.jpg", image_bytes, "image/jpeg")},
        data={"sample_hint": "cotton-tshirt"},
    )
    assert scan_resp.status_code == 200
    assert scan_resp.json()["total_co2_kg"] > 0
