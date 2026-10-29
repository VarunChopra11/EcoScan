from fastapi import APIRouter
from app.core.config import settings
from app.models.schemas import HealthResponse
from app.services.vision_service import vision_service

router = APIRouter()


@router.get("", response_model=HealthResponse)
def health_check():
    """
    Returns API health status, version, and Azure AI Foundry configuration state.
    """
    azure_ready = vision_service.is_azure_configured
    mode = "azure_openai_gpt4o" if azure_ready else "offline_heuristic_fallback"
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        azure_openai_configured=azure_ready,
        vision_mode=mode,
    )
