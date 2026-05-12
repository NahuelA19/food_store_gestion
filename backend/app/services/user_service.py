"""User service layer for authentication, profile management, and preferences."""

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.uow import UnitOfWork
from app.models.auth import AuthResponse, LoginRequest, RegisterRequest
from app.models.user import User, UserPreference
from app.models.user_profile import (
    AdminUserResponse,
    UserPreferencesResponse,
    UserPreferenceUpdate,
    UserProfileUpdate,
    UserPublicResponse,
    UserResponse,
    UserStatusUpdate,
)
from app.security.jwt import create_access_token
from app.security.password import get_password_hash, validate_password_strength, verify_password
from app.validation import DEFAULT_PREFERENCES

logger = logging.getLogger(__name__)


async def register_user(uow: UnitOfWork, data: RegisterRequest) -> AuthResponse:
    """Register a new user and create default preferences."""
    # Validate password strength
    is_valid, error_msg = validate_password_strength(data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_msg,
        )

    # Check if email already exists
    result = await uow.session.execute(select(User).where(User.email == data.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(data.password)
    new_user = User(
        email=data.email.lower(),
        hashed_password=hashed_password,
        is_active=True,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
    )
    uow.session.add(new_user)
    await uow.flush()
    await uow.refresh(new_user)

    # Initialize default preferences
    for pref_key, pref_value in DEFAULT_PREFERENCES.items():
        pref = UserPreference(
            user_id=new_user.id,
            pref_key=pref_key,
            pref_value=pref_value,
        )
        uow.session.add(pref)

    # Generate JWT token
    access_token = create_access_token(data={"user_id": new_user.id, "email": new_user.email})

    return AuthResponse(
        id=new_user.id,
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        phone=new_user.phone,
        access_token=access_token,
        token_type="bearer",
    )


async def authenticate_user(uow: UnitOfWork, data: LoginRequest) -> AuthResponse:
    """Authenticate a user and return a JWT token."""
    # Find user by email
    result = await uow.session.execute(select(User).where(User.email == data.email.lower()))
    user = result.scalar_one_or_none()

    # Check if user exists and password is correct
    if not user or not verify_password(data.password, user.hashed_password):
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

    # Generate JWT token
    access_token = create_access_token(data={"user_id": user.id, "email": user.email})

    return AuthResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        access_token=access_token,
        token_type="bearer",
    )


async def get_public_profile(uow: UnitOfWork, user_id: int) -> UserPublicResponse:
    """Get public profile of another user."""
    result = await uow.session.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None)),
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserPublicResponse.model_validate(user)


async def update_user_profile(uow: UnitOfWork, user: User, data: UserProfileUpdate) -> UserResponse:
    """Update a user's profile fields."""
    if data.first_name is not None:
        user.first_name = data.first_name
    if data.last_name is not None:
        user.last_name = data.last_name
    if data.phone is not None:
        user.phone = data.phone

    user.updated_at = datetime.now(timezone.utc)
    uow.session.add(user)
    await uow.flush()
    await uow.refresh(user)
    return UserResponse.model_validate(user)


async def get_user_preferences(uow: UnitOfWork, user_id: int) -> UserPreferencesResponse:
    """Get user preferences with fallback to defaults."""
    result = await uow.session.execute(
        select(UserPreference).where(UserPreference.user_id == user_id),
    )
    prefs_list = result.scalars().all()
    prefs_dict = {p.pref_key: p.pref_value for p in prefs_list}

    return UserPreferencesResponse(
        language=prefs_dict.get("language", DEFAULT_PREFERENCES["language"]),
        theme=prefs_dict.get("theme", DEFAULT_PREFERENCES["theme"]),
        notifications=prefs_dict.get("notifications", DEFAULT_PREFERENCES["notifications"]),
    )


async def update_user_preferences(uow: UnitOfWork, user_id: int, data: UserPreferenceUpdate) -> UserPreferencesResponse:
    """Update or create user preferences."""
    preference_fields = {
        "language": data.language,
        "theme": data.theme,
        "notifications": data.notifications,
    }

    for key, value in preference_fields.items():
        if value is not None:
            result = await uow.session.execute(
                select(UserPreference).where(
                    UserPreference.user_id == user_id,
                    UserPreference.pref_key == key,
                ),
            )
            pref = result.scalar_one_or_none()
            if pref:
                pref.pref_value = value
                pref.updated_at = datetime.now(timezone.utc)
            else:
                pref = UserPreference(
                    user_id=user_id,
                    pref_key=key,
                    pref_value=value,
                )
                uow.session.add(pref)

    await uow.flush()
    return await get_user_preferences(uow, user_id)


async def soft_delete_user(uow: UnitOfWork, user: User) -> None:
    """Soft delete a user account."""
    user.deleted_at = datetime.now(timezone.utc)
    user.is_active = False
    uow.session.add(user)


async def admin_list_users(uow: UnitOfWork, cursor: Optional[int], limit: int) -> dict[str, Any]:
    """List all users with cursor pagination for admins."""
    query = select(User)
    if cursor:
        query = query.where(User.id > cursor)
    query = query.order_by(User.id).limit(limit + 1)

    result = await uow.session.execute(query)
    users = result.scalars().all()

    next_cursor = None
    if len(users) > limit:
        users = users[:limit]
        next_cursor = users[-1].id

    return {
        "users": [AdminUserResponse.model_validate(u) for u in users],
        "next_cursor": next_cursor,
    }


async def admin_update_user_status(uow: UnitOfWork, user_id: int, data: UserStatusUpdate) -> AdminUserResponse:
    """Update user status (admin only)."""
    result = await uow.session.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None)),
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_active = data.is_active
    user.updated_at = datetime.now(timezone.utc)
    uow.session.add(user)
    await uow.flush()
    await uow.refresh(user)
    return AdminUserResponse.model_validate(user)
