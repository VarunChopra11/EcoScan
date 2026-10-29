import io
import uuid
import base64
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from PIL import Image

from app.core.config import settings
from app.models.schemas import (
    ScanResponse,
    GarmentItem,
)
from app.services.vision_service import vision_service
from app.services.carbon_service import carbon_service
from app.services.reward_service import reward_service
from app.storage.memory_store import memory_store

router = APIRouter()


def validate_image_payload(raw_bytes: bytes, content_type: Optional[str] = None) -> None:
    """
    Ensures the uploaded file conforms to security, size, and image integrity constraints.
    """
    if len(raw_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(raw_bytes) > settings.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size exceeds the {settings.MAX_IMAGE_SIZE_BYTES // (1024*1024)}MB maximum limit.",
        )

    # Deep verification with Pillow to guard against malformed files or scripts disguised as images
    try:
        with Image.open(io.BytesIO(raw_bytes)) as img:
            img.verify()
            detected_format = (img.format or "").upper()
            if detected_format not in ["JPEG", "PNG", "WEBP"]:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail=f"Unsupported image format: {detected_format}. Supported formats: JPEG, PNG, WEBP.",
                )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted image file.",
        )


@router.post("", response_model=ScanResponse, status_code=status.HTTP_200_OK)
async def scan_garment_image(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    sample_hint: Optional[str] = Form(None),
):
    """
    Analyzes an uploaded clothing photograph or camera snapshot:
    1. Validates file integrity, dimensions, and type.
    2. Identifies clothing items via Azure OpenAI GPT-4o Vision or robust fallback.
    3. Computes lifecycle carbon footprints, material multipliers, and benchmarks.
    4. Calculates EcoPoints and reward breakdown.
    5. Saves scan to user's in-memory session history.
    """
    raw_bytes: bytes = b""
    mime_type: str = "image/jpeg"

    if file:
        raw_bytes = await file.read()
        mime_type = file.content_type or "image/jpeg"
    elif image_base64:
        # Support live camera capture data URL: data:image/jpeg;base64,....
        try:
            if "," in image_base64:
                header, encoded = image_base64.split(",", 1)
                if "image/png" in header:
                    mime_type = "image/png"
                elif "image/webp" in header:
                    mime_type = "image/webp"
                else:
                    mime_type = "image/jpeg"
            else:
                encoded = image_base64
            raw_bytes = base64.b64decode(encoded)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid base64-encoded image data.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image provided. Please upload an image file or capture a photo.",
        )

    validate_image_payload(raw_bytes, mime_type)

    # 1. Vision recognition
    vision_result = await vision_service.analyze_garment_image(
        image_bytes=raw_bytes,
        mime_type=mime_type,
        sample_hint=sample_hint,
    )
    raw_items = vision_result.get("items", [])
    vision_source = vision_result.get("source", "offline_model_heuristic")

    if not raw_items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No clothing or footwear items detected in the image. Please scan a clear photo containing apparel.",
        )

    # 2. Compute carbon metrics for each detected garment
    garment_models = []
    total_co2 = 0.0
    total_savings = 0.0

    for item_data in raw_items:
        name = item_data.get("name", "Clothing Item")
        material = item_data.get("material", "conventional cotton")
        confidence = float(item_data.get("confidence", 0.90))
        color = item_data.get("color")
        description = item_data.get("description")

        metrics = carbon_service.calculate_item_footprint(
            garment_name=item_data.get("category", name),
            material_str=material,
        )

        garment = GarmentItem(
            name=name,
            category=metrics["category"],
            material=metrics["material"],
            confidence=round(confidence, 2),
            color=color,
            estimated_co2_kg=metrics["actual_co2_kg"],
            baseline_co2_kg=metrics["baseline_co2_kg"],
            benchmark_co2_kg=metrics["benchmark_co2_kg"],
            co2_saved_kg=metrics["co2_saved_kg"],
            eco_rating=metrics["eco_rating"],
            care_recommendation=metrics["care_tip"],
            description=description,
        )
        garment_models.append(garment)
        total_co2 += garment.estimated_co2_kg
        total_savings += garment.co2_saved_kg

    total_co2 = round(total_co2, 2)
    total_savings = round(total_savings, 2)
    overall_rating = carbon_service.get_eco_rating(total_co2)

    # 3. Calculate EcoPoints & rewards
    points_awarded, points_breakdown = reward_service.calculate_points(garment_models)

    # 4. Equivalents & advice
    equivalents = carbon_service.calculate_equivalents(total_co2)
    summary_tip = reward_service.generate_summary_tip(garment_models, overall_rating)

    scan_response = ScanResponse(
        id=f"scan_{uuid.uuid4().hex[:10]}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        items=garment_models,
        total_co2_kg=total_co2,
        total_co2_saved_kg=total_savings,
        overall_eco_rating=overall_rating,
        points_awarded=points_awarded,
        points_breakdown=points_breakdown,
        equivalents=equivalents,
        summary_tip=summary_tip,
        vision_source=vision_source,
    )

    # 5. Persist to in-memory history
    memory_store.add_scan(scan_response)

    return scan_response
