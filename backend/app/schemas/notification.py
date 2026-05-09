"""Notification Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    """Notification response model."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    title: str
    message: str
    related_order_id: Optional[int] = None
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    """Paginated notification list response."""

    items: list[NotificationResponse]
    total_count: int
    unread_count: int
    page: int
    total_pages: int


class UnreadCountResponse(BaseModel):
    """Unread notification count response."""

    unread_count: int
