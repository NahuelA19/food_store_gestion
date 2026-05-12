"""JWT token generation and validation."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt  # type: ignore[import-untyped]
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Generate a JWT access token.

    Args:
        data: Dictionary of claims to encode (typically {"user_id": ..., "email": ...})
        expires_delta: Token expiration time. Defaults to ACCESS_TOKEN_EXPIRE_MINUTES from config

    Returns:
        Encoded JWT token string
    """
    to_encode: dict[str, Any] = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire})

    encoded_jwt: str = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm,
    )

    return encoded_jwt


async def create_refresh_token(user_id: int, session: AsyncSession) -> str:
    """Generate a refresh token, store its hash, return the raw token."""
    from app.models.refresh_token import RefreshToken

    token = secrets.token_urlsafe(64)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    rt = RefreshToken(
        token_hash=token_hash,
        user_id=user_id,
        expires_at=expires_at,
    )
    session.add(rt)
    await session.flush()

    return token


def hash_token(raw_token: str) -> str:
    """Hash a raw refresh token with SHA-256 for DB lookup."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


def verify_token(token: str) -> dict[str, Any] | None:
    """Verify and decode a JWT token.

    Args:
        token: JWT token string to verify and decode

    Returns:
        Decoded token payload as dictionary if valid, None if invalid or expired

    Raises:
        JWTError: If token is malformed or has invalid signature
    """
    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        return payload
    except (JWTError, ValidationError):
        return None
