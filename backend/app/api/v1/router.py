from fastapi import APIRouter
from app.api.v1.endpoints import scan, offers, history, health, prod

api_router = APIRouter()

# Test Build (In-Memory Assignment Mode) Endpoints
api_router.include_router(scan.router, prefix="/scan", tags=["Test Build - Scan"])
api_router.include_router(offers.router, prefix="/offers", tags=["Test Build - Offers"])
api_router.include_router(history.router, prefix="/history", tags=["Test Build - History"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])

# Production Build (Clerk Auth + MongoDB Persistence) Endpoints
api_router.include_router(prod.router, prefix="/prod", tags=["Production Build"])
