import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.storage.mongo_store import mongo_store

client = TestClient(app)


def create_test_image_bytes(format="JPEG") -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (100, 100), color=(46, 125, 50))
    img.save(buf, format=format)
    return buf.getvalue()


@pytest.fixture(autouse=True)
def clean_mongo_mock():
    mongo_store.reset_mock_data()


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


def test_auth_with_test_token_or_header():
    """Authorized requests succeed with user identity extracted."""
    headers = {"X-Test-User-Id": "user_alice"}
    resp = client.get("/api/v1/prod/dashboard", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["user_id"] == "user_alice"
    assert data["stats"]["current_points"] == 50
    assert len(data["recent_scans"]) == 0


def test_data_isolation_between_users():
    """
    Ensure complete data isolation:
    User Alice's scans and points are NOT visible to User Bob.
    """
    alice_headers = {"X-Test-User-Id": "user_alice"}
    bob_headers = {"X-Test-User-Id": "user_bob"}

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
    """Verify persistent wallet updates and offer redemption."""
    user_headers = {"X-Test-User-Id": "user_carol"}

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
