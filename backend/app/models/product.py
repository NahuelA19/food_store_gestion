"""Product ORM model."""

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Product(Base, TimestampMixin):
    """Product model for the e-commerce catalog."""

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    is_available: Mapped[bool] = mapped_column(default=True, nullable=False, index=True)

    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="products")
    inventory: Mapped["Inventory"] = relationship(
        "Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Product(id={self.id}, name={self.name}, price={self.price})>"
