"""OrderItem ORM model."""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.product import Product

from app.models.base import Base


class OrderItem(Base):
    """Order item model linking orders to products with quantities."""

    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    # Snapshot fields (for auditability)
    nombre_snapshot: Mapped[str | None] = mapped_column(String(255), nullable=True)
    precio_snapshot: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product")

    def __repr__(self) -> str:
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_id={self.product_id})>"
