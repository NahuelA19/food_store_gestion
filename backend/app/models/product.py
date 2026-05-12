"""Product ORM model."""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.ingrediente import Ingrediente
    from app.models.inventory import Inventory
    from app.models.review import Review
    from app.models.wishlist import WishlistItem
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Product(Base, SoftDeleteMixin, TimestampMixin):
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
    image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    search_vector: Mapped[str | None] = mapped_column(TSVECTOR, nullable=True)

    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="products")  # noqa: F821
    inventory: Mapped["Inventory"] = relationship(  # noqa: F821
        "Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan"
    )
    reviews: Mapped[list["Review"]] = relationship(  # noqa: F821
        "Review", back_populates="product", cascade="all, delete-orphan"
    )
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(  # noqa: F821
        "WishlistItem", back_populates="product", cascade="all, delete-orphan"
    )

    ingredientes: Mapped[list["Ingrediente"]] = relationship(  # noqa: F821
        "Ingrediente",
        secondary="producto_ingredientes",
        back_populates="productos",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Product(id={self.id}, name={self.name}, price={self.price})>"
