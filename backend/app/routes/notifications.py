"""Notification API routes for the Food Store."""

import logging
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.uow import UnitOfWork
from app.dependencies import get_current_user, get_uow
from app.models.user import User
from app.schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from app.services.notification_service import (
    get_unread_count,
    get_user_notifications,
    mark_all_as_read,
    mark_as_read,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=NotificationListResponse)
async def list_notifications(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    unread: bool = Query(False, description="Filter by unread only"),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> NotificationListResponse:
    """List notifications for the current user (paginated)."""
    items, total_count, unread_count = await get_user_notifications(
        uow=uow,
        user_id=current_user.id,
        page=page,
        limit=limit,
        unread_only=unread,
    )

    total_pages = max(1, ceil(total_count / limit)) if total_count > 0 else 1

    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in items],
        total_count=total_count,
        unread_count=unread_count,
        page=page,
        total_pages=total_pages,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_notification_count(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> UnreadCountResponse:
    """Get the unread notification count for the current user."""
    count = await get_unread_count(uow=uow, user_id=current_user.id)
    return UnreadCountResponse(unread_count=count)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> NotificationResponse:
    """Mark a single notification as read."""
    notif = await mark_as_read(
        uow=uow,
        notification_id=notification_id,
        user_id=current_user.id,
    )
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return NotificationResponse.model_validate(notif)


@router.patch("/read-all", response_model=dict)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Mark all unread notifications as read."""
    updated = await mark_all_as_read(uow=uow, user_id=current_user.id)
    return {"updated": updated}
