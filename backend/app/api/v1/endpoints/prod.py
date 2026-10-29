import io
import uuid
import base64
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel

from app.core.auth import get_current_user, AuthenticatedUser
from app.core.config import settings
from app.models.schemas import (
    ScanResponse,
    GarmentItem,
    Offer,
    OfferRedemptionResponse,
    UserHistoryResponse,
    LifetimeStats,
)
from app.api.v1.endpoints.scan import validate_image_payload
from app.services.vision_service import vision_service
from app.services.carbon_service import carbon_service
from app.services.reward_service import reward_service
from app.storage.mongo_store import mongo_store

router = APIRouter()


class ProductionDashboardResponse(BaseModel):
    user: Dict[str, Any]
    stats: LifetimeStats
    recent_scans: List[ScanResponse]
    offers: List[Offer]
    database_mode: str


@router.get("/dashboard", response_model=ProductionDashboardResponse)
async def get_production_dashboard(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Returns complete dashboard context for the authenticated user:
    - User account metadata
    - Persistent EcoReward wallet balance
    - Lifetime carbon impact statistics
    - Chronological recent scans
    - Available partner offers with personalized unlock progress
    """
    user_doc = await mongo_store.get_or_create_user(current_user.user_id, current_user.email)
    stats = await mongo_store.get_user_stats(current_user.user_id)
    scans = await mongo_store.get_user_scans(current_user.user_id, limit=10)
    offers = await mongo_store.get_user_offers(current_user.user_id)
    db_mode = "mongodb_cluster" if mongo_store.is_live_mongo else "persistent_storage"

    clean_user = {
        "user_id": user_doc["user_id"],
        "email": user_doc.get("email") or current_user.email,
        "name": current_user.name,
        "created_at": user_doc.get("created_at"),
    }

    return ProductionDashboardResponse(
        user=clean_user,
        stats=stats,
        recent_scans=scans,
        offers=offers,
        database_mode=db_mode,
    )


@router.get("/user", status_code=status.HTTP_200_OK)
async def get_user_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Returns the authenticated user's profile and current wallet balance.
    """
    user_doc = await mongo_store.get_or_create_user(current_user.user_id, current_user.email)
    stats = await mongo_store.get_user_stats(current_user.user_id)
    return {
        "user_id": user_doc["user_id"],
        "email": user_doc.get("email"),
        "name": current_user.name,
        "created_at": user_doc.get("created_at"),
        "wallet": {
            "current_points": stats.current_points,
            "lifetime_points_earned": stats.lifetime_points_earned,
            "total_points_spent": stats.total_points_spent,
        },
    }


@router.post("/scan", response_model=ScanResponse, status_code=status.HTTP_200_OK)
async def production_scan_garment(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    sample_hint: Optional[str] = Form(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Authenticated production apparel scan:
    1. Derives identity strictly from verified token (current_user.user_id).
    2. Validates image payload integrity.
    3. Runs AI garment vision classification.
    4. Computes lifecycle carbon emissions & eco-savings.
    5. Persists scan to MongoDB.
    6. Atomically awards EcoPoints to user's persistent wallet.
    """
    raw_bytes: bytes = b""
    mime_type: str = "image/jpeg"

    if file:
        raw_bytes = await file.read()
        mime_type = file.content_type or "image/jpeg"
    elif image_base64:
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
            detail="No clothing or footwear items detected. Please scan a clear photo of apparel.",
        )

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

    points_awarded, points_breakdown = reward_service.calculate_points(garment_models)
    equivalents = carbon_service.calculate_equivalents(total_co2)
    summary_tip = reward_service.generate_summary_tip(garment_models, overall_rating)

    scan_response = ScanResponse(
        id=f"scan_prod_{uuid.uuid4().hex[:10]}",
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

    # Persist directly to MongoDB for this authenticated user
    await mongo_store.save_scan(current_user.user_id, scan_response)

    return scan_response


@router.get("/offers", response_model=List[Offer])
async def get_production_offers(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Returns partner offers customized to the authenticated user's wallet balance.
    """
    return await mongo_store.get_user_offers(current_user.user_id)


@router.post("/offers/{offer_id}/redeem", response_model=OfferRedemptionResponse)
async def redeem_production_offer(
    offer_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Redeems a partner offer with atomic point deduction from the user's MongoDB wallet.
    """
    try:
        return await mongo_store.redeem_offer(current_user.user_id, offer_id)
    except ValueError as err:
        msg = str(err)
        if "not found" in msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)
        elif "already been redeemed" in msg.lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=msg)
        elif "insufficient" in msg.lower():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


@router.get("/history", response_model=UserHistoryResponse)
async def get_production_history(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Returns the persistent lifetime scan history and redeemed vouchers for this authenticated user.
    """
    return await mongo_store.get_user_history(current_user.user_id)
