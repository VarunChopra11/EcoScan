import io
import base64
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.storage.memory_store import memory_store

client = TestClient(app)


def create_test_image_bytes(format="JPEG") -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (120, 120), color=(34, 197, 94))
    img.save(buf, format=format)
    return buf.getvalue()


def test_root_endpoint():
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert "EcoScan" in data["app"]


def test_health_endpoint():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "vision_mode" in data


def test_get_offers_endpoint():
    resp = client.get("/api/v1/offers")
    assert resp.status_code == 200
    offers = resp.json()
    assert isinstance(offers, list)
    assert len(offers) >= 4
    first = offers[0]
    assert "id" in first
    assert "points_cost" in first
    assert "is_unlocked" in first


def test_scan_image_file_upload():
    memory_store.reset()
    image_bytes = create_test_image_bytes(format="JPEG")

    files = {"file": ("test_shirt.jpg", image_bytes, "image/jpeg")}
    data = {"sample_hint": "denim-jacket"}

    resp = client.post("/api/v1/scan", files=files, data=data)
    assert resp.status_code == 200
    scan = resp.json()
    assert scan["id"].startswith("scan_")
    assert len(scan["items"]) == 1
    assert scan["items"][0]["category"] == "jacket"
    assert scan["total_co2_kg"] > 0
    assert scan["points_awarded"] > 0
    assert "equivalents" in scan
    assert "points_breakdown" in scan


def test_scan_base64_data_url():
    image_bytes = create_test_image_bytes(format="PNG")
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:image/png;base64,{b64}"

    resp = client.post("/api/v1/scan", data={"image_base64": data_url, "sample_hint": "organic-tee"})
    assert resp.status_code == 200
    scan = resp.json()
    assert len(scan["items"]) == 1
    assert scan["items"][0]["category"] == "t-shirt"
    assert scan["items"][0]["material"] == "organic cotton"


def test_scan_no_clothing_detected_returns_422():
    image_bytes = create_test_image_bytes(format="JPEG")
    files = {"file": ("car.jpg", image_bytes, "image/jpeg")}
    data = {"sample_hint": "no-clothing"}

    resp = client.post("/api/v1/scan", files=files, data=data)
    assert resp.status_code == 422
    assert "No clothing" in resp.json()["detail"]


def test_redeem_offer_and_history_flow():
    memory_store.reset()
    # Initial balance is 0 pts
    init_hist = client.get("/api/v1/history").json()
    assert init_hist["stats"]["current_points"] == 0

    # Attempting to redeem 50 pt offer with 0 points must fail
    fail_resp = client.post("/api/v1/offers/patagonia-worn-wear-10/redeem")
    assert fail_resp.status_code == 400
    assert "insufficient" in fail_resp.json()["detail"].lower()

    # User scans an item to earn points
    image_bytes = create_test_image_bytes(format="JPEG")
    scan_resp = client.post(
        "/api/v1/scan",
        files={"file": ("tee.jpg", image_bytes, "image/jpeg")},
        data={"sample_hint": "organic-tee"},
    )
    assert scan_resp.status_code == 200
    pts_earned = scan_resp.json()["points_awarded"]
    assert pts_earned >= 50

    # Now Patagonia costs 50 pts and user has enough points
    resp = client.post("/api/v1/offers/patagonia-worn-wear-10/redeem")
    assert resp.status_code == 200
    redemption = resp.json()
    assert redemption["points_spent"] == 50
    assert redemption["remaining_points"] == pts_earned - 50
    assert redemption["code"].startswith("PAT-WORN-")

    # History reflects the redemption
    hist_resp = client.get("/api/v1/history")
    assert hist_resp.status_code == 200
    hist = hist_resp.json()
    assert hist["stats"]["current_points"] == pts_earned - 50
    assert len(hist["redeemed_offers"]) == 1

    # Reset endpoint returns session to 0 points
    reset_resp = client.delete("/api/v1/history")
    assert reset_resp.status_code == 200
    fresh_hist = client.get("/api/v1/history").json()
    assert fresh_hist["stats"]["current_points"] == 0
    assert len(fresh_hist["redeemed_offers"]) == 0
