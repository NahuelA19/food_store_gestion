"""Order ORM model."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.estado_pedido import EstadoPedido

if TYPE_CHECKING:
    from app.models.direccion_entrega import DireccionEntrega
    from app.models.historial_estado_pedido import HistorialEstadoPedido
    from app.models.notification import Notification
    from app.models.order_item import OrderItem
    from app.models.pago import Pago
    from app.models.user import User

from app.models.base import Base, TimestampMixin


class PaymentStatus(str, Enum):
    """Payment status enumeration."""

    PENDING = "pending"
    SUCCEEDED = "succeeded"
    APPROVED = "approved"   # MercadoPago uses 'approved'; also stored by seeds
    FAILED = "failed"
    REFUNDED = "refunded"


class OrderStatus(str, Enum):
    """Order status enumeration (FSM v6 — 6 states)."""

    PENDIENTE = "pendiente"
    PENDING = "pending"
    PAGO_PENDIENTE = "pago_pendiente"
    PAYMENT_PENDING = "payment_pending"
    PAGADO = "pagado"
    PAID = "paid"
    PAGO_FALLIDO = "pago_fallido"
    PAYMENT_FAILED = "payment_failed"
    CONFIRMADO = "confirmado"
    CONFIRMED = "confirmed"
    EN_PREP = "en_prep"
    EN_CAMINO = "en_camino"
    SHIPPED = "shipped"
    PREPARANDO = "preparando"
    LISTO = "listo"
    ENTREGADO = "entregado"
    DELIVERED = "delivered"
    CANCELADO = "cancelado"
    CANCELLED = "cancelled"


class Order(Base, TimestampMixin):
    """Order model for tracking customer orders."""

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus, native_enum=False),
        default=OrderStatus.PAYMENT_PENDING,
        nullable=False,
        index=True,
    )
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    notas: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )
    status_history: Mapped[list[dict] | None] = mapped_column(
        JSON,
        default=list,
        nullable=True,
    )

    # ERD v5: state catalog FK
    estado_codigo: Mapped[str | None] = mapped_column(
        String(30),
        ForeignKey("estados_pedido.codigo", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    # Payment fields (MercadoPago)
    # values_callable ensures SQLAlchemy stores/reads .value strings (lowercase)
    # matching the PostgreSQL paymentstatus enum: pending, approved, succeeded, etc.
    payment_status: Mapped[PaymentStatus | None] = mapped_column(
        SQLEnum(PaymentStatus, values_callable=lambda x: [e.value for e in x], native_enum=False),
        default=PaymentStatus.PENDING,
        nullable=True,
    )
    mp_preference_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    mp_payment_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    payment_method: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="order", cascade="all, delete-orphan"
    )

    historial: Mapped[list["HistorialEstadoPedido"]] = relationship(
        "HistorialEstadoPedido",
        back_populates="pedido",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    pagos: Mapped[list["Pago"]] = relationship(
        "Pago",
        back_populates="pedido",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # Dirección de entrega
    direccion_entrega_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("direcciones_entrega.id", ondelete="SET NULL"),
        nullable=True,
    )
    direccion_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    direccion_entrega: Mapped["DireccionEntrega | None"] = relationship(
        "DireccionEntrega", back_populates="pedidos"
    )

    estado: Mapped["EstadoPedido | None"] = relationship(
        "EstadoPedido",
        foreign_keys=[estado_codigo],
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Order(id={self.id}, user_id={self.user_id}, status={self.status})>"
