"""Category ORM model."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Category(Base, TimestampMixin):
    """Product category model."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Relationships
    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="category", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name={self.name})>"
