import io
import time
import pytest
import jwt
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from app.main import app
from app.core.config import settings
from app.storage.memory_store import memory_store, InMemoryStore
from app.storage.mongo_store import mongo_store, MongoStore
from app.services.vision_service import vision_service

client = TestClient(app)
TEST_SECRET_KEY = "test-secret-key-32-chars-minimum-security"


def create_solid_image_bytes(size=(100, 100), color=(100, 150, 200), format="JPEG") -> bytes:
    """Creates a flat, single-color canvas image."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    return buf.getvalue()


def create_pattern_image_bytes(size=(100, 100), format="JPEG") -> bytes:
    """Creates an image with contrast and pattern."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([10, 10, 80, 80], fill=(20, 60, 180), outline=(0, 0, 0))
    draw.line([0, 0, 100, 100], fill=(200, 30, 30), width=3)
    img.save(buf, format=format)
    return buf.getvalue()


def create_test_jwt(user_id: str, email: str = "test@user.app") -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": int(time.time() + 3600),
    }
    return jwt.encode(payload, TEST_SECRET_KEY, algorithm="HS256")


@pytest.fixture(autouse=True)
def setup_test_env():
    orig_key = settings.CLERK_SECRET_KEY
    orig_live = mongo_store._is_live_mongo
    settings.CLERK_SECRET_KEY = TEST_SECRET_KEY
    mongo_store._is_live_mongo = False
    memory_store.reset()
    mongo_store.reset_mock_data()
    yield
    settings.CLERK_SECRET_KEY = orig_key
    mongo_store._is_live_mongo = orig_live


# =========================================================================
# 1. Non-Clothing Image Rejections
# =========================================================================

@pytest.mark.parametrize("non_clothing_hint", [
    "empty",
    "no-clothing",
    "non-clothing",
    "car",
    "dog",
    "cat",
    "animal",
    "landscape",
    "food",
    "vehicle",
])
def test_test_mode_rejects_non_clothing_images(non_clothing_hint):
    """Test Build must reject non-clothing images with 422 and no_clothing_detected error code."""
    img_bytes = create_pattern_image_bytes()
    resp = client.post(
        "/api/v1/scan",
        files={"file": ("photo.jpg", img_bytes, "image/jpeg")},
        data={"sample_hint": non_clothing_hint},
    )
    assert resp.status_code == 422
    assert "no_clothing_detected" in resp.json()["detail"].lower() or "clearer" in resp.json()["detail"].lower()
    assert resp.headers.get("X-Error-Code") == "no_clothing_detected"


@pytest.mark.parametrize("non_clothing_hint", [
    "empty",
    "car",
    "dog",
    "landscape",
])
def test_prod_mode_rejects_non_clothing_images(non_clothing_hint):
    """Production Build must reject non-clothing images with 422 for authenticated users."""
    token = create_test_jwt("user_audit_prod")
    img_bytes = create_pattern_image_bytes()
    resp = client.post(
        "/api/v1/prod/scan",
        files={"file": ("photo.jpg", img_bytes, "image/jpeg")},
        data={"sample_hint": non_clothing_hint},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422
    assert "no_clothing_detected" in resp.json()["detail"].lower() or "clearer" in resp.json()["detail"].lower()
    assert resp.headers.get("X-Error-Code") == "no_clothing_detected"


def test_solid_flat_color_canvas_rejected_server_side():
    """Flat single-color images (no clothing features) must be rejected by server pre-validation."""
    solid_bytes = create_solid_image_bytes(color=(80, 80, 80))
    resp = client.post(
        "/api/v1/scan",
        files={"file": ("blank.jpg", solid_bytes, "image/jpeg")},
    )
    assert resp.status_code == 422
    assert "no_clothing_detected" in resp.json()["detail"].lower() or "clearer" in resp.json()["detail"].lower()


def test_tiny_blurry_dimensions_rejected():
    """Images with dimensions < 40x40 must be rejected as uncertain / unidentifiable."""
    tiny_bytes = create_pattern_image_bytes(size=(20, 20))
    resp = client.post(
        "/api/v1/scan",
        files={"file": ("tiny.jpg", tiny_bytes, "image/jpeg")},
    )
    assert resp.status_code == 422
    assert "uncertain_image" in resp.json()["detail"].lower() or "clearer" in resp.json()["detail"].lower()


# =========================================================================
# 2. Blurry & Ambiguous Rejections
# =========================================================================

@pytest.mark.parametrize("ambiguous_hint", ["blurry", "uncertain", "ambiguous"])
def test_ambiguous_image_rejection(ambiguous_hint):
    """Ambiguous or blurry images must return 422 with uncertain_image error code."""
    img_bytes = create_pattern_image_bytes()
    resp = client.post(
        "/api/v1/scan",
        files={"file": ("unclear.jpg", img_bytes, "image/jpeg")},
        data={"sample_hint": ambiguous_hint},
    )
    assert resp.status_code == 422
    assert resp.headers.get("X-Error-Code") == "uncertain_image"
    assert "uncertain_image" in resp.json()["detail"].lower()


# =========================================================================
# 3. Confidence Threshold & Filtering
# =========================================================================

def test_low_confidence_detections_rejected():
    """Items below MIN_CONFIDENCE_THRESHOLD (default 0.70) must be discarded."""
    img_bytes = create_pattern_image_bytes()
    resp = client.post(
        "/api/v1/scan",
        files={"file": ("faded.jpg", img_bytes, "image/jpeg")},
        data={"sample_hint": "low-confidence"},
    )
    assert resp.status_code == 422
    assert resp.headers.get("X-Error-Code") == "uncertain_image"


def test_mixed_detection_discards_non_apparel_and_keeps_clothing():
    """When model detects clothing AND non-apparel (smartphone), only the garment is scored."""
    img_bytes = create_pattern_image_bytes()
    resp = client.post(
        "/api/v1/scan",
        files={"file": ("mixed.jpg", img_bytes, "image/jpeg")},
        data={"sample_hint": "mixed-detection"},
    )
    assert resp.status_code == 200
    data = resp.json()
    # Exactly one item should remain: the jacket
    assert len(data["items"]) == 1
    assert data["items"][0]["category"] == "jacket"
    # The smartphone should not be present
    assert not any("phone" in item["name"].lower() or item["category"] == "electronics" for item in data["items"])
    assert data["total_co2_kg"] > 0
    assert data["points_awarded"] > 0


# =========================================================================
# 4. Malformed Responses & API Failures Fail Safely
# =========================================================================

def test_malformed_model_output_fails_safely():
    """Malformed item records must be dropped, returning 422 without fabricating data."""
    img_bytes = create_pattern_image_bytes()
    resp = client.post(
        "/api/v1/scan",
        files={"file": ("malformed.jpg", img_bytes, "image/jpeg")},
        data={"sample_hint": "malformed"},
    )
    assert resp.status_code == 422


from unittest.mock import patch, AsyncMock, PropertyMock

@pytest.mark.asyncio
async def test_azure_api_failure_handled_safely():
    """If Azure Vision fails, safe fallback is executed without fabricating unvalidated scores."""
    img_bytes = create_pattern_image_bytes()
    with patch.object(type(vision_service), "is_azure_configured", new_callable=PropertyMock, return_value=True):
        with patch.object(vision_service, "_call_azure_gpt4o", new_callable=AsyncMock, side_effect=Exception("Azure API Timeout")):
            res = await vision_service.analyze_garment_image(img_bytes, mime_type="image/jpeg")
            # Should not crash and should return validated structure
            assert isinstance(res, dict)
            assert "is_clothing" in res
            assert "items" in res


# =========================================================================
# 5. History & Wallet Integrity on Rejected Scans
# =========================================================================

def test_rejected_scan_does_not_modify_test_mode_wallet_or_history():
    """Rejected scans in Test Build must never award points or add entries to history."""
    memory_store.reset()
    assert memory_store.get_stats().current_points == 0
    assert len(memory_store.get_scans()) == 0

    img_bytes = create_pattern_image_bytes()
    resp = client.post(
        "/api/v1/scan",
        files={"file": ("dog.jpg", img_bytes, "image/jpeg")},
        data={"sample_hint": "dog"},
    )
    assert resp.status_code == 422

    # Stats and history must remain strictly zero
    stats = client.get("/api/v1/history").json()["stats"]
    assert stats["current_points"] == 0
    assert stats["total_scans"] == 0
    assert stats["total_co2_kg"] == 0.0

    history_resp = client.get("/api/v1/history").json()
    assert len(history_resp["scans"]) == 0


def test_rejected_scan_does_not_modify_prod_mode_wallet_or_history():
    """Rejected scans in Production Build must never award points or save to user's MongoDB history."""
    token = create_test_jwt("user_integrity_check")
    headers = {"Authorization": f"Bearer {token}"}

    # Initial dashboard check
    init_dash = client.get("/api/v1/prod/dashboard", headers=headers).json()
    assert init_dash["stats"]["current_points"] == 0
    assert init_dash["stats"]["total_scans"] == 0

    img_bytes = create_pattern_image_bytes()
    resp = client.post(
        "/api/v1/prod/scan",
        files={"file": ("car.jpg", img_bytes, "image/jpeg")},
        data={"sample_hint": "car"},
        headers=headers,
    )
    assert resp.status_code == 422

    # Post-rejection dashboard check
    post_dash = client.get("/api/v1/prod/dashboard", headers=headers).json()
    assert post_dash["stats"]["current_points"] == 0
    assert post_dash["stats"]["total_scans"] == 0
    assert len(post_dash["recent_scans"]) == 0

    # User profile wallet check
    user_info = client.get("/api/v1/prod/user", headers=headers).json()
    assert user_info["wallet"]["current_points"] == 0
    assert user_info["wallet"]["lifetime_points_earned"] == 0


# =========================================================================
# 6. Zero Balance Initialization
# =========================================================================

def test_zero_balance_initialization_in_memory_store():
    """Fresh in-memory store starts with exactly 0 points."""
    store = InMemoryStore()
    stats = store.get_stats()
    assert stats.current_points == 0
    assert stats.lifetime_points_earned == 0
    assert stats.total_points_spent == 0


@pytest.mark.asyncio
async def test_zero_balance_initialization_mongo_store():
    """Fresh user profile in mongo_store starts with exactly 0 points."""
    store = MongoStore()
    store._initialized = True
    store._is_live_mongo = False
    user = await store.get_or_create_user("user_new_zero_wallet")
    assert user["current_points"] == 0
    assert user["lifetime_points_earned"] == 0
    assert user["total_points_spent"] == 0


@pytest.mark.asyncio
async def test_preserves_existing_user_balances():
    """Existing user's earned points are preserved and never reset on subsequent logins/queries."""
    store = MongoStore()
    store._initialized = True
    store._is_live_mongo = False
    user = await store.get_or_create_user("user_existing_loyal")
    # Simulate user having earned 180 points from previous scans
    store._mock_users["user_existing_loyal"]["current_points"] = 180
    store._mock_users["user_existing_loyal"]["lifetime_points_earned"] = 180

    # Retrieve again (simulating subsequent sign-in or dashboard reload)
    reloaded_user = await store.get_or_create_user("user_existing_loyal")
    assert reloaded_user["current_points"] == 180
    assert reloaded_user["lifetime_points_earned"] == 180
