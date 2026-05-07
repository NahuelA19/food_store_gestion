"""
Health check endpoints for Food Store API
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.security.auth import get_current_user
from database.session import get_db_session

router = APIRouter(prefix="/health", tags=["health"])


class HealthResponse(BaseModel):
    """Health check response model."""

    status: str
    service: str


class DatabaseHealthResponse(BaseModel):
    """Database health check response model."""

    status: str
    database: str
    pool_size: int | None = None


@router.get("/", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Basic health check endpoint"""
    return HealthResponse(status="ok", service="food-store-api")


@router.get("/live", response_model=HealthResponse)
async def liveness() -> HealthResponse:
    """Kubernetes liveness probe"""
    return HealthResponse(status="alive", service="food-store-api")


@router.get("/ready", response_model=HealthResponse)
async def readiness() -> HealthResponse:
    """Kubernetes readiness probe"""
    return HealthResponse(status="ready", service="food-store-api")


@router.get("/db", response_model=DatabaseHealthResponse)
async def database_health(
    session: AsyncSession = Depends(get_db_session),
) -> DatabaseHealthResponse:
    """Database connectivity check"""
    try:
        # Perform a simple query to check database connectivity
        await session.execute(text("SELECT 1"))
        return DatabaseHealthResponse(
            status="ok",
            database="postgresql",
            pool_size=20,
        )
    except Exception as e:
        return DatabaseHealthResponse(
            status=f"error: {str(e)}",
            database="postgresql",
            pool_size=None,
        )


# Public test endpoint
@router.get("/public/test", response_model=HealthResponse)
async def public_test() -> HealthResponse:
    """Public endpoint without authentication."""
    return HealthResponse(status="ok", service="food-store-api-public")


# Protected test endpoint
class ProtectedResponse(BaseModel):
    """Protected endpoint response."""

    status: str
    user_id: int
    user_email: str


@router.get("/protected/test", response_model=ProtectedResponse)
async def protected_test(current_user: User = Depends(get_current_user)) -> ProtectedResponse:
    """Protected endpoint requiring authentication."""
    return ProtectedResponse(
        status="ok",
        user_id=current_user.id,
        user_email=current_user.email,
    )
