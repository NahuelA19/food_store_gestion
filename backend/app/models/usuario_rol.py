from app.models.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey, Integer, String


class UsuarioRol(Base):
    __tablename__ = "usuario_rol"
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    rol_codigo: Mapped[str] = mapped_column(String(30), ForeignKey("roles.codigo", ondelete="CASCADE"), primary_key=True)
