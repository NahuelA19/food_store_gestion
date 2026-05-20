"""FastAPI dependency functions."""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, settings
from app.models.user import User
from app.core.uow import UnitOfWork
from app.security.jwt import verify_token
from database.session import get_db_session

security = HTTPBearer()

# Alias for convenience
get_db = get_db_session


def get_settings() -> Settings:
    """Get application settings."""
    return settings



async def get_uow(
    session: AsyncSession = Depends(get_db),
) -> AsyncGenerator[UnitOfWork, None]:
    """Provide a UnitOfWork tied to the request session."""
    async with UnitOfWork(session) as uow:
        yield uow


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    uow: UnitOfWork = Depends(get_uow),
) -> User:
    """Get the currently authenticated user from JWT token."""
    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Use UoW repository instead of direct session execute
    user = await uow.users.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account has been deleted",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Verify current user is an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


def require_role(*roles: str):
    """Factory: returns a FastAPI dependency that checks the user has one of the given roles.

    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(current_user: User = Depends(require_role("admin"))):
            ...

        @router.get("/staff")
        async def staff_endpoint(current_user: User = Depends(require_role("admin", "staff"))):
            ...
    """
    async def _role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of these roles: {', '.join(roles)}",
            )
        return current_user

    return _role_checker


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        HTTPBearer(auto_error=False)
    ),
    uow: UnitOfWork = Depends(get_uow),
) -> User | None:
    """Get the currently authenticated user or None."""
    if credentials is None:
        return None

    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        return None

    user_id = payload.get("user_id")
    if user_id is None:
        return None

    user = await uow.users.get_by_id(user_id)

    if not user or user.deleted_at is not None:
        return None

    return user


def get_websocket_manager(request: Request):
    """Get the WebSocket connection manager from app.state.
    
    Returns:
        ConnectionManager: The globally initialized ConnectionManager, or None if not yet initialized.
    """
    return getattr(request.app.state, "websocket_manager", None)
