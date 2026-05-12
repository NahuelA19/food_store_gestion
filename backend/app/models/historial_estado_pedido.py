"""HistorialEstadoPedido ORM model (append-only)."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.estado_pedido import EstadoPedido
    from app.models.order import Order
    from app.models.user import User


class HistorialEstadoPedido(Base):
    """State transition history for an order (no updated_at)."""

    __tablename__ = "historial_estados_pedido"

    id: Mapped[int] = mapped_column(primary_key=True)
    pedido_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    estado_desde: Mapped[str | None] = mapped_column(
        String(30),
        ForeignKey("estados_pedido.codigo"),
        nullable=True,
    )
    estado_hasta: Mapped[str] = mapped_column(
        String(30),
        ForeignKey("estados_pedido.codigo"),
        nullable=False,
    )
    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    motivo: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    pedido: Mapped["Order"] = relationship("Order", back_populates="historial")
    usuario: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[usuario_id],
        back_populates="historial_estados_pedido",
    )
    estado_desde_ref: Mapped["EstadoPedido | None"] = relationship(
        "EstadoPedido",
        foreign_keys=[estado_desde],
    )
    estado_hasta_ref: Mapped["EstadoPedido"] = relationship(
        "EstadoPedido",
        foreign_keys=[estado_hasta],
    )
