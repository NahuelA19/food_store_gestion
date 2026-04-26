"""
Health check endpoints for Food Store API
"""

from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {"status": "ok", "service": "food-store-api"}


@router.get("/live")
async def liveness():
    """Kubernetes liveness probe"""
    return {"status": "alive"}


@router.get("/ready")
async def readiness():
    """Kubernetes readiness probe"""
    return {"status": "ready"}
