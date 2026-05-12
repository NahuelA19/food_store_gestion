"""ProductoIngrediente association table."""

from __future__ import annotations

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ProductoIngrediente(Base):
    """Association table between Product and Ingrediente."""

    __tablename__ = "producto_ingredientes"

    producto_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True,
    )
    ingrediente_id: Mapped[int] = mapped_column(
        ForeignKey("ingredientes.id"),
        primary_key=True,
    )
