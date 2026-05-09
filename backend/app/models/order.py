"""Order ORM model."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.notification import Notification
    from app.models.order_item import OrderItem
    from app.models.user import User

from app.models.base import Base, TimestampMixin


class PaymentStatus(str, Enum):
    """Payment status enumeration."""

    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"


class OrderStatus(str, Enum):
    """Order status enumeration."""

    PAYMENT_PENDING = "payment_pending"
    PAYMENT_FAILED = "payment_failed"
    PAID = "paid"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(Base, TimestampMixin):
    """Order model for tracking customer orders."""

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus),
        default=OrderStatus.PAYMENT_PENDING,
        nullable=False,
        index=True,
    )
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    status_history: Mapped[list[dict] | None] = mapped_column(
        JSON,
        default=list,
        nullable=True,
    )

    # Payment fields
    payment_status: Mapped[Optional[PaymentStatus]] = mapped_column(
        SQLEnum(PaymentStatus),
        default=PaymentStatus.PENDING,
        nullable=True,
    )
    stripe_payment_intent_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    payment_method: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(  # noqa: F821
        "Notification", back_populates="order", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Order(id={self.id}, user_id={self.user_id}, status={self.status})>"
