"""User ORM model."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.models.cart import Cart
    from app.models.order import Order
    from app.models.review import Review
    from app.models.wishlist import WishlistItem

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """User model for authentication and profile."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)

    # Profile fields
    first_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Stripe customer ID for payment processing
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Soft delete
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    preferences: Mapped[list["UserPreference"]] = relationship(  # noqa: F821
        "UserPreference", back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )
    cart: Mapped[list["Cart"]] = relationship("Cart", back_populates="user", uselist=False,  # noqa: F821
                                               cascade="all, delete-orphan")
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="user")  # noqa: F821
    reviews: Mapped[list["Review"]] = relationship(  # noqa: F821
        "Review", foreign_keys="Review.user_id", back_populates="user", cascade="all, delete-orphan"
    )
    moderated_reviews: Mapped[list["Review"]] = relationship(  # noqa: F821
        "Review", foreign_keys="Review.moderated_by", back_populates="moderator"
    )
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(  # noqa: F821
        "WishlistItem", back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def name(self) -> str:
        """Get the user's display name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.email

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, first_name={self.first_name}, last_name={self.last_name})>"


class UserPreference(Base, TimestampMixin):
    """User preference model for storing user preferences."""

    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pref_key: Mapped[str] = mapped_column(String(50), nullable=False)
    pref_value: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="preferences")

    def __repr__(self) -> str:
        return f"<UserPreference(user_id={self.user_id}, key={self.pref_key}, value={self.pref_value})>"
