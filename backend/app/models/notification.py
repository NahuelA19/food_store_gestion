"""Notification ORM model."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.user import User

from app.models.base import Base, TimestampMixin


class Notification(Base, TimestampMixin):
    """Notification model for in-app and email notifications."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    related_order_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now,
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User", back_populates="notifications", lazy="selectin"
    )
    order: Mapped[Optional["Order"]] = relationship(
        "Order", back_populates="notifications", lazy="selectin"
    )

    def __repr__(self) -> str:
        return (
            f"<Notification(id={self.id}, user_id={self.user_id}, "
            f"type={self.type}, is_read={self.is_read})>"
        )


# Composite index for common query pattern
Index("ix_notifications_user_read", Notification.user_id, Notification.is_read)
