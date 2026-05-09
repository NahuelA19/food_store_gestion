"""Notification service for creating, querying, and managing notifications."""

import asyncio
import logging

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.order import OrderStatus
from app.models.user import User, UserPreference
from app.services.email_service import send_email as async_send_email

logger = logging.getLogger(__name__)

# Map order status changes to notification details
_NOTIFICATION_MAP: dict[str, dict] = {
    "payment_succeeded": {
        "type": "payment_succeeded",
        "title": "Payment Confirmed",
        "message": "Your payment has been received and confirmed.",
    },
    "order_confirmed": {
        "type": "order_confirmed",
        "title": "Order Confirmed",
        "message": "Your order has been confirmed and is being prepared.",
    },
    "shipped": {
        "type": "shipped",
        "title": "Order Shipped",
        "message": "Your order has been shipped and is on its way.",
    },
    "delivered": {
        "type": "delivered",
        "title": "Order Delivered",
        "message": "Your order has been delivered. Enjoy!",
    },
    "cancelled": {
        "type": "cancelled",
        "title": "Order Cancelled",
        "message": "Your order has been cancelled.",
    },
}

# Status transition to notification type mapping
_STATUS_TO_NOTIFICATION: dict[OrderStatus, str] = {
    OrderStatus.PAID: "payment_succeeded",
    OrderStatus.CONFIRMED: "order_confirmed",
    OrderStatus.SHIPPED: "shipped",
    OrderStatus.DELIVERED: "delivered",
    OrderStatus.CANCELLED: "cancelled",
}


async def get_user_notification_preference(db: AsyncSession, user_id: int) -> str:
    """Get the user's notification preference.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        str: "email", "push", or "off" (default: "email")
    """
    result = await db.execute(
        select(UserPreference).where(
            UserPreference.user_id == user_id,
            UserPreference.pref_key == "notifications",
        )
    )
    pref = result.scalar_one_or_none()
    return pref.pref_value if pref else "email"


async def create_notification(
    db: AsyncSession,
    user_id: int,
    type: str,
    title: str,
    message: str,
    related_order_id: int | None = None,
) -> Notification | None:
    """Create a notification respecting user preferences.

    If user preference is "off", no notification is created.

    Args:
        db: Database session
        user_id: User ID
        type: Notification type identifier
        title: Notification title
        message: Notification message body
        related_order_id: Optional related order ID

    Returns:
        Notification or None if preference is "off"
    """
    pref = await get_user_notification_preference(db, user_id)
    if pref == "off":
        return None

    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        related_order_id=related_order_id,
        is_read=False,
    )
    db.add(notif)
    await db.flush()
    await db.refresh(notif)
    return notif


async def create_and_send_notification(
    db: AsyncSession,
    user_id: int,
    type: str,
    title: str,
    message: str,
    related_order_id: int | None = None,
) -> Notification | None:
    """Create an in-app notification and optionally send an email.

    Respects the user's notification preference:
    - "email": creates in-app notification AND sends email
    - "push": creates in-app notification only
    - "off": does nothing

    Args:
        db: Database session
        user_id: User ID
        type: Notification type
        title: Notification title
        message: Notification message body
        related_order_id: Optional related order ID

    Returns:
        Notification or None
    """
    pref = await get_user_notification_preference(db, user_id)
    if pref == "off":
        return None

    # Create in-app notification
    notif = await create_notification(db, user_id, type, title, message, related_order_id)
    await db.commit()

    # Send email if preference is "email"
    if pref == "email":
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user and user.email:
            template_map = {
                "payment_succeeded": "payment_succeeded.html",
                "order_confirmed": "order_confirmed.html",
                "shipped": "order_shipped.html",
                "delivered": "order_delivered.html",
                "cancelled": "order_cancelled.html",
            }
            template = template_map.get(type, "order_confirmed.html")
            asyncio.create_task(
                async_send_email(
                    to=user.email,
                    subject=title,
                    template_name=template,
                    context={
                        "title": title,
                        "message": message,
                        "order_id": related_order_id,
                        "user_name": user.name,
                    },
                )
            )

    return notif


async def get_user_notifications(
    db: AsyncSession,
    user_id: int,
    page: int = 1,
    limit: int = 20,
    unread_only: bool = False,
) -> tuple[list[Notification], int, int]:
    """Get paginated notifications for a user.

    Args:
        db: Database session
        user_id: User ID
        page: Page number (1-indexed)
        limit: Items per page
        unread_only: If True, only return unread notifications

    Returns:
        Tuple of (items, total_count, unread_count)
    """
    page = max(1, page)
    limit = min(max(1, limit), 100)

    # Base query
    base_query = select(Notification).where(Notification.user_id == user_id)

    if unread_only:
        base_query = base_query.where(Notification.is_read == False)  # noqa: E712

    # Get total count
    count_result = await db.execute(
        select(func.count(Notification.id)).where(Notification.user_id == user_id)
    )
    total_count = count_result.scalar_one()

    # Get unread count
    unread_result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.is_read == False,  # noqa: E712
        )
    )
    unread_count = unread_result.scalar_one()

    # Get paginated results
    offset = (page - 1) * limit
    result = await db.execute(
        base_query.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
    )
    items = list(result.scalars().all())

    return items, total_count, unread_count


async def get_unread_count(
    db: AsyncSession,
    user_id: int,
) -> int:
    """Get unread notification count for a user.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        Number of unread notifications
    """
    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.is_read == False,  # noqa: E712
        )
    )
    return result.scalar_one()


async def mark_as_read(
    db: AsyncSession,
    notification_id: int,
    user_id: int,
) -> Notification | None:
    """Mark a notification as read.

    Args:
        db: Database session
        notification_id: Notification ID
        user_id: User ID (for ownership verification)

    Returns:
        Updated Notification or None if not found
    """
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        return None

    notif.is_read = True
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


async def mark_all_as_read(
    db: AsyncSession,
    user_id: int,
) -> int:
    """Mark all notifications as read for a user.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        Number of notifications updated
    """
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
        .values(is_read=True)
    )
    await db.commit()
    return result.rowcount  # type: ignore[return-value]


async def create_order_notification(
    db: AsyncSession,
    order_id: int,
    user_id: int,
    new_status: OrderStatus,
) -> Notification | None:
    """Create a notification for an order status change.

    Args:
        db: Database session
        order_id: Order ID
        user_id: User ID
        new_status: New order status

    Returns:
        Created Notification or None
    """
    notif_key = _STATUS_TO_NOTIFICATION.get(new_status)
    if not notif_key:
        return None

    info = _NOTIFICATION_MAP[notif_key]
    message = f"{info['message']} Order #{order_id}."

    return await create_and_send_notification(
        db=db,
        user_id=user_id,
        type=info["type"],
        title=info["title"],
        message=message,
        related_order_id=order_id,
    )


async def cleanup_old_notifications(db: AsyncSession, days: int = 90) -> int:
    """Delete notifications older than the specified number of days.

    Args:
        db: Database session
        days: Retention period in days

    Returns:
        Number of deleted notifications
    """
    from datetime import datetime, timedelta, timezone

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(Notification).where(Notification.created_at < cutoff)
    )
    old = list(result.scalars().all())
    for n in old:
        await db.delete(n)
    await db.commit()
    return len(old)
