from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1.router import api_router
from app.storage.mongo_store import mongo_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Attempt to initialize MongoDB connection on startup
    await mongo_store.initialize()
    yield
    # Cleanup on shutdown


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="EcoScan Dual-Mode API: Clothing Carbon Footprint Scanner & Circular Rewards. "
                "Supports both In-Memory Test Build and Persistent Clerk Auth + MongoDB Production Build.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 master router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return JSONResponse(
        content={
            "app": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
            "modes": {
                "test_build": "In-Memory Session (Preserved Assignment Build)",
                "production_build": "Clerk Auth + MongoDB Persistent Wallet",
            },
            "docs_url": "/docs",
            "v1_base": settings.API_V1_STR,
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
