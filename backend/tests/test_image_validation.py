import io
import pytest
from fastapi import HTTPException
from PIL import Image

from app.api.v1.endpoints.scan import validate_image_payload
from app.core.config import settings


def create_sample_image(format="JPEG", size=(100, 100)) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=(46, 125, 50))
    img.save(buf, format=format)
    return buf.getvalue()


def test_valid_jpeg_image():
    raw = create_sample_image(format="JPEG")
    # Should not raise
    validate_image_payload(raw, "image/jpeg")


def test_valid_png_image():
    raw = create_sample_image(format="PNG")
    # Should not raise
    validate_image_payload(raw, "image/png")


def test_empty_image_raises_400():
    with pytest.raises(HTTPException) as exc:
        validate_image_payload(b"", "image/jpeg")
    assert exc.value.status_code == 400
    assert "empty" in exc.value.detail.lower()


def test_corrupted_image_raises_400():
    fake_bytes = b"NOT_AN_IMAGE_FILE_DATA_CORRUPT"
    with pytest.raises(HTTPException) as exc:
        validate_image_payload(fake_bytes, "image/jpeg")
    assert exc.value.status_code == 400
    assert "invalid or corrupted" in exc.value.detail.lower()


def test_oversized_image_raises_413():
    # Construct bytes exceeding MAX_IMAGE_SIZE_BYTES
    large_size = settings.MAX_IMAGE_SIZE_BYTES + 1024
    oversized_bytes = b"0" * large_size
    with pytest.raises(HTTPException) as exc:
        validate_image_payload(oversized_bytes, "image/jpeg")
    assert exc.value.status_code == 413
    assert "exceeds" in exc.value.detail.lower()
