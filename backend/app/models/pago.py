"""Pago ORM model."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Numeric, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.forma_pago import FormaPago
    from app.models.order import Order


class Pago(Base):
    """MercadoPago payment record for an order."""

    __tablename__ = "pagos"

    id: Mapped[int] = mapped_column(primary_key=True)
    pedido_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"),
        nullable=False,
        index=True,
    )
    mp_payment_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mp_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    mp_status_detail: Mapped[str | None] = mapped_column(String(100), nullable=True)
    external_reference: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        nullable=False,
        server_default=text("gen_random_uuid()"),
    )
    idempotency_key: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        nullable=False,
        unique=True,
        server_default=text("gen_random_uuid()"),
    )
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    forma_pago_codigo: Mapped[str | None] = mapped_column(
        String(30),
        ForeignKey("formas_pago.codigo"),
        nullable=True,
    )
    mp_raw_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    pedido: Mapped["Order"] = relationship("Order", back_populates="pagos")
    forma_pago: Mapped["FormaPago | None"] = relationship(
        "FormaPago", back_populates="pagos"
    )
