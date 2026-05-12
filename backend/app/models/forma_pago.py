"""FormaPago ORM model."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class FormaPago(Base):
    """Payment method catalog."""

    __tablename__ = "formas_pago"

    codigo: Mapped[str] = mapped_column(String(30), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    habilitado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    pagos: Mapped[list["Pago"]] = relationship(  # noqa: F821
        "Pago",
        back_populates="forma_pago",
        lazy="selectin",
    )
