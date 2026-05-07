"""Authentication dependency injection and middleware."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.token import TokenData
from app.models.user import User
from app.security.jwt import verify_token
from database.session import get_db_session

# Security scheme for OpenAPI documentation
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    """Dependency to extract and validate JWT token from request.

    Args:
        credentials: HTTP Bearer credentials from request
        session: Database session

    Returns:
        User object from database

    Raises:
        HTTPException 401: Missing or invalid token
    """
    token = credentials.credentials

    # Verify token signature and expiration
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract user ID and email from token
    try:
        user_id_val: int | None = payload.get("user_id")
        email_val: str | None = payload.get("email")

        if user_id_val is None or email_val is None:
            raise ValueError("Missing user claims in token")

        token_data = TokenData(user_id=user_id_val, email=email_val)
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    # Fetch user from database to verify it still exists and is active
    result = await session.execute(select(User).where(User.id == token_data.user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user
