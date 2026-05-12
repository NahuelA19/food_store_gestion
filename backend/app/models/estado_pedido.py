"""EstadoPedido ORM model."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class EstadoPedido(Base):
    """Order state catalog used by FSM + history."""

    __tablename__ = "estados_pedido"

    codigo: Mapped[str] = mapped_column(String(30), primary_key=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    es_terminal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    historial_desde: Mapped[list["HistorialEstadoPedido"]] = relationship(  # noqa: F821
        "HistorialEstadoPedido",
        foreign_keys="HistorialEstadoPedido.estado_desde",
        lazy="selectin",
    )
    historial_hasta: Mapped[list["HistorialEstadoPedido"]] = relationship(  # noqa: F821
        "HistorialEstadoPedido",
        foreign_keys="HistorialEstadoPedido.estado_hasta",
        lazy="selectin",
    )
