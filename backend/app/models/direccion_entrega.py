from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.order import Order

from app.models.base import Base, TimestampMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Integer, String, Text
from datetime import datetime


class DireccionEntrega(Base, TimestampMixin):
    __tablename__ = "direcciones_entrega"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    direccion: Mapped[str] = mapped_column(Text, nullable=False)
    ciudad: Mapped[str] = mapped_column(String(100), nullable=False)
    provincia: Mapped[str] = mapped_column(String(100), nullable=False)
    codigo_postal: Mapped[str | None] = mapped_column(String(20), nullable=True)
    usuario: Mapped[User] = relationship(back_populates="direcciones")
    pedidos: Mapped[list[Order]] = relationship(back_populates="direccion_entrega")
