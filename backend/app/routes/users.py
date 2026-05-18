"""User profile and preferences routes."""

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.future import select

from app.core.uow import UnitOfWork
from app.dependencies import get_admin_user, get_current_user, get_uow
from app.models.user import User, UserPreference
from app.models.user_profile import (
    AdminCreateUserRequest,
    AdminUpdateUserRequest,
    AdminUserResponse,
    ChangePasswordRequest,
    UserPreferencesResponse,
    UserPreferenceUpdate,
    UserProfileUpdate,
    UserPublicResponse,
    UserResponse,
    UserStatusUpdate,
)
from app.services import user_service
from app.validation import DEFAULT_PREFERENCES

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get current user's full profile.

    Args:
        current_user: Current authenticated user

    Returns:
        UserResponse with full profile information

    Raises:
        HTTPException 401: If not authenticated
    """
    return UserResponse.model_validate(current_user)


@router.get("/{user_id}", response_model=UserPublicResponse)
async def get_public_profile(
    user_id: int,
    uow: UnitOfWork = Depends(get_uow),
) -> UserPublicResponse:
    """Get public profile of another user (limited fields).

    Args:
        user_id: ID of user to fetch
        uow: Unit of Work for database access

    Returns:
        UserPublicResponse with limited profile information

    Raises:
        HTTPException 404: If user not found or deleted
    """
    user = await uow.users.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserPublicResponse.model_validate(user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    body: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> UserResponse:
    """Update current user's profile.

    Args:
        body: Profile update request
        current_user: Current authenticated user
        uow: Unit of Work for database access

    Returns:
        UserResponse with updated profile

    Raises:
        HTTPException 401: If not authenticated
        HTTPException 422: If validation fails
    """
    # Update only provided fields
    if body.first_name is not None:
        current_user.first_name = body.first_name
    if body.last_name is not None:
        current_user.last_name = body.last_name
    if body.phone is not None:
        current_user.phone = body.phone

    # Update timestamp
    current_user.updated_at = datetime.now(timezone.utc)

    uow.session.add(current_user)
    await uow.commit()
    await uow.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.get("/me/preferences", response_model=UserPreferencesResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> UserPreferencesResponse:
    """Get current user's preferences.

    Args:
        current_user: Current authenticated user
        uow: Unit of Work for database access

    Returns:
        UserPreferencesResponse with all preferences

    Raises:
        HTTPException 401: If not authenticated
    """
    # Fetch preferences from database
    result = await uow.session.execute(
        select(UserPreference).where(UserPreference.user_id == current_user.id)
    )
    prefs_list = result.scalars().all()

    # Build preferences dict
    prefs_dict = {}
    for pref in prefs_list:
        prefs_dict[pref.pref_key] = pref.pref_value

    # Fill in defaults for missing preferences
    for key, value in DEFAULT_PREFERENCES.items():
        if key not in prefs_dict:
            prefs_dict[key] = value

    return UserPreferencesResponse(
        language=prefs_dict.get("language", DEFAULT_PREFERENCES["language"]),
        theme=prefs_dict.get("theme", DEFAULT_PREFERENCES["theme"]),
        notifications=prefs_dict.get("notifications", DEFAULT_PREFERENCES["notifications"]),
    )


@router.put("/me/preferences", response_model=UserPreferencesResponse)
async def update_preferences(
    body: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> UserPreferencesResponse:
    """Update current user's preferences.

    Args:
        body: Preferences update request
        current_user: Current authenticated user
        uow: Unit of Work for database access

    Returns:
        UserPreferencesResponse with all preferences after update

    Raises:
        HTTPException 401: If not authenticated
        HTTPException 422: If validation fails
    """
    # Update provided preferences
    now = datetime.now(timezone.utc)
    preference_fields = {
        "language": body.language,
        "theme": body.theme,
        "notifications": body.notifications,
    }

    for key, value in preference_fields.items():
        if value is not None:
            # Check if preference exists
            result = await uow.session.execute(
                select(UserPreference).where(
                    UserPreference.user_id == current_user.id,
                    UserPreference.pref_key == key,
                )
            )
            pref = result.scalar_one_or_none()

            if pref:
                # Update existing
                pref.pref_value = value
                pref.updated_at = now
            else:
                # Create new
                pref = UserPreference(
                    user_id=current_user.id,
                    pref_key=key,
                    pref_value=value,
                )
                uow.session.add(pref)

    await uow.commit()

    # Fetch all preferences and return
    result = await uow.session.execute(
        select(UserPreference).where(UserPreference.user_id == current_user.id)
    )
    prefs_list = result.scalars().all()

    prefs_dict = {}
    for pref in prefs_list:
        prefs_dict[pref.pref_key] = pref.pref_value

    # Fill in defaults
    for key, value in DEFAULT_PREFERENCES.items():
        if key not in prefs_dict:
            prefs_dict[key] = value

    return UserPreferencesResponse(
        language=prefs_dict.get("language", DEFAULT_PREFERENCES["language"]),
        theme=prefs_dict.get("theme", DEFAULT_PREFERENCES["theme"]),
        notifications=prefs_dict.get("notifications", DEFAULT_PREFERENCES["notifications"]),
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> None:
    """Delete current user's account (soft delete).

    Args:
        current_user: Current authenticated user
        uow: Unit of Work for database access

    Raises:
        HTTPException 401: If not authenticated
    """
    current_user.deleted_at = datetime.now(timezone.utc)
    current_user.is_active = False

    uow.session.add(current_user)
    await uow.commit()


@router.get("", response_model=dict)
async def list_users(
    cursor: Optional[int] = Query(None, description="Cursor for pagination (user ID)"),
    limit: int = Query(10, ge=1, le=100, description="Number of users per page"),
    current_user: User = Depends(get_admin_user),
    uow: UnitOfWork = Depends(get_uow),
) -> dict[str, Any]:
    """List all users with cursor-based pagination (admin only).

    Args:
        cursor: Cursor user ID for pagination
        limit: Number of users per page (1-100)
        current_user: Current admin user
        uow: Unit of Work for database access

    Returns:
        dict with users list and next_cursor

    Raises:
        HTTPException 403: If user is not admin
    """
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


@router.patch("/{user_id}/status", response_model=AdminUserResponse)
async def update_user_status(
    user_id: int,
    body: UserStatusUpdate,
    current_user: User = Depends(get_admin_user),
    uow: UnitOfWork = Depends(get_uow),
) -> AdminUserResponse:
    """Activate or deactivate a user (admin only).

    Args:
        user_id: ID of user to update
        body: Status update request with is_active
        current_user: Current admin user
        uow: Unit of Work for database access

    Returns:
        AdminUserResponse with updated user

    Raises:
        HTTPException 403: If user is not admin
        HTTPException 404: If user not found or deleted
    """
    user = await uow.users.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_active = body.is_active
    user.updated_at = datetime.now(timezone.utc)
    uow.session.add(user)
    await uow.commit()
    await uow.refresh(user)

    return AdminUserResponse.model_validate(user)


@router.post("", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    body: AdminCreateUserRequest,
    current_user: User = Depends(get_admin_user),
    uow: UnitOfWork = Depends(get_uow),
) -> AdminUserResponse:
    """Create a new employee with a temporary password (admin only)."""
    new_user = await user_service.admin_create_employee(uow, body)
    await uow.commit()
    return AdminUserResponse.model_validate(new_user)


@router.put("/{user_id}", response_model=AdminUserResponse)
async def update_employee(
    user_id: int,
    body: AdminUpdateUserRequest,
    current_user: User = Depends(get_admin_user),
    uow: UnitOfWork = Depends(get_uow),
) -> AdminUserResponse:
    """Update an existing employee's profile (admin only). Does not change password."""
    updated_user = await user_service.admin_update_employee(uow, user_id, body)
    await uow.commit()
    return AdminUserResponse.model_validate(updated_user)


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> None:
    """Change the authenticated user's password and clear the must_change_password flag."""
    await user_service.change_user_password(uow, current_user, body)
    await uow.commit()
