from fastapi import APIRouter
from app.api.v1.endpoints import scan, offers, history, health

api_router = APIRouter()
api_router.include_router(scan.router, prefix="/scan", tags=["Scan"])
api_router.include_router(offers.router, prefix="/offers", tags=["Offers"])
api_router.include_router(history.router, prefix="/history", tags=["History"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
