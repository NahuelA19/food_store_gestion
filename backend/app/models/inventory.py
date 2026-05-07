"""Inventory ORM model for stock management."""

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Inventory(Base, TimestampMixin):
    """Inventory model for tracking product stock levels."""

    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    reserved_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="inventory")

    @property
    def available_quantity(self) -> int:
        """Calculate available quantity after reservations."""
        return max(0, self.stock_quantity - self.reserved_quantity)

    def __repr__(self) -> str:
        return f"<Inventory(product_id={self.product_id}, stock={self.stock_quantity}, reserved={self.reserved_quantity})>"
