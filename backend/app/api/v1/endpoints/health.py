from fastapi import APIRouter
from app.core.config import settings
from app.models.schemas import HealthResponse
from app.services.vision_service import vision_service
from app.storage.mongo_store import mongo_store

router = APIRouter()


@router.get("", response_model=HealthResponse)
def health_check():
    """
    Returns API health status, version, Azure AI Foundry, Clerk, and Database states.
    """
    azure_ready = vision_service.is_azure_configured
    mode = "azure_openai_gpt4o" if azure_ready else "offline_heuristic_fallback"
    clerk_ready = bool(settings.CLERK_SECRET_KEY or settings.CLERK_ISSUER or settings.CLERK_JWKS_URL)
    db_mode = "mongodb_cluster" if mongo_store.is_live_mongo else "persistent_storage"

    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        azure_openai_configured=azure_ready,
        vision_mode=mode,
        clerk_configured=clerk_ready,
        database_mode=db_mode,
    )
