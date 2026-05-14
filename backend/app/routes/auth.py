"""Authentication routes for user registration, login, token refresh, and logout."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import update
from sqlalchemy.future import select

from app.core.uow import UnitOfWork
from app.dependencies import get_uow
from app.models.auth import (
    AuthResponse,
    LoginRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    RegisterRequest,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User, UserPreference
from app.security.jwt import create_access_token, create_refresh_token, hash_token
from app.security.limiter import limiter
from app.security.password import get_password_hash, validate_password_strength, verify_password
from app.validation import DEFAULT_PREFERENCES

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    uow: UnitOfWork = Depends(get_uow),
) -> AuthResponse:
    """Register a new user.

    Args:
        body: Registration request with email, password, and optional profile fields
        uow: Unit of Work for database transactions

    Returns:
        AuthResponse with user info, JWT access token, and refresh token

    Raises:
        HTTPException 409: Email already registered
        HTTPException 422: Weak password or invalid email
    """
    # Validate password strength
    is_valid, error_msg = validate_password_strength(body.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_msg,
        )

    # Check if email already exists
    result = await uow.session.execute(select(User).where(User.email == body.email.lower()))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create new user with profile fields
    hashed_password = get_password_hash(body.password)
    new_user = User(
        email=body.email.lower(),
        hashed_password=hashed_password,
        is_active=True,
        first_name=body.first_name,
        last_name=body.last_name,
        phone=body.phone,
    )
    uow.session.add(new_user)
    await uow.flush()

    # Initialize default preferences
    for pref_key, pref_value in DEFAULT_PREFERENCES.items():
        pref = UserPreference(
            user_id=new_user.id,
            pref_key=pref_key,
            pref_value=pref_value,
        )
        uow.session.add(pref)

    # Generate token pair
    access_token = create_access_token(data={"user_id": new_user.id, "email": new_user.email})
    raw_refresh = await create_refresh_token(new_user.id, uow.session)

    await uow.commit()
    await uow.refresh(new_user)

    return AuthResponse(
        id=new_user.id,
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        phone=new_user.phone,
        access_token=access_token,
        refresh_token=raw_refresh,
        token_type="bearer",
        role=new_user.role,
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/15minute")
async def login(
    request: Request,
    body: LoginRequest,
    uow: UnitOfWork = Depends(get_uow),
) -> AuthResponse:
    """Login with email and password.

    Rate-limited to 5 attempts per 15 minutes per IP.

    Args:
        request: FastAPI request (required by slowapi limiter)
        body: Login request with email and password
        uow: Unit of Work for database transactions

    Returns:
        AuthResponse with user info, JWT access token, and refresh token

    Raises:
        HTTPException 401: Invalid credentials
        HTTPException 403: Account is inactive
    """
    # Find user by email
    result = await uow.session.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()

    # Check if user exists and password is correct
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active and not deleted
    if not user.is_active or user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Generate token pair
    access_token = create_access_token(data={"user_id": user.id, "email": user.email})
    raw_refresh = await create_refresh_token(user.id, uow.session)

    await uow.commit()

    return AuthResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        access_token=access_token,
        refresh_token=raw_refresh,
        token_type="bearer",
        role=user.role,
    )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(
    body: RefreshTokenRequest,
    uow: UnitOfWork = Depends(get_uow),
) -> RefreshTokenResponse:
    """Refresh an access token using a valid refresh token (rotation).

    Validates the refresh token hash, checks expiration and revocation,
    then issues a new token pair and revokes the old one.

    Args:
        body: Request with the refresh token
        uow: Unit of Work for database transactions

    Returns:
        RefreshTokenResponse with new access_token, refresh_token, and token_type

    Raises:
        HTTPException 401: Invalid, expired, or revoked refresh token
    """
    token_hash = hash_token(body.refresh_token)
    result = await uow.session.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    stored_token = result.scalar_one_or_none()

    if stored_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if revoked → replay attack detected
    if stored_token.revoked_at is not None:
        # RN-AU05: revoke ALL tokens for this user on replay attack
        await uow.session.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == stored_token.user_id)
            .values(revoked_at=datetime.now(timezone.utc))
        )
        await uow.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if expired
    if stored_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Revoke old token
    stored_token.revoked_at = datetime.now(timezone.utc)

    # Create new token pair
    new_access = create_access_token(data={"user_id": stored_token.user_id})
    new_refresh = await create_refresh_token(stored_token.user_id, uow.session)

    await uow.commit()

    return RefreshTokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    body: RefreshTokenRequest,
    uow: UnitOfWork = Depends(get_uow),
) -> dict[str, str]:
    """Revoke a refresh token.

    Args:
        body: Request with the refresh token to revoke
        uow: Unit of Work for database transactions

    Returns:
        Dict with success message

    Raises:
        HTTPException 404: Token not found or already revoked
    """
    token_hash = hash_token(body.refresh_token)
    result = await uow.session.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    stored_token = result.scalar_one_or_none()

    if stored_token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Refresh token not found",
        )

    if stored_token.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Refresh token already revoked",
        )

    stored_token.revoked_at = datetime.now(timezone.utc)
    await uow.commit()

    return {"message": "Logged out successfully"}
