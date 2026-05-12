"""Ingrediente ORM model."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Ingrediente(Base):
    """Ingredient catalog item."""

    __tablename__ = "ingredientes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    es_alergeno: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    productos: Mapped[list["Product"]] = relationship(  # noqa: F821
        "Product",
        secondary="producto_ingredientes",
        back_populates="ingredientes",
        lazy="selectin",
    )
