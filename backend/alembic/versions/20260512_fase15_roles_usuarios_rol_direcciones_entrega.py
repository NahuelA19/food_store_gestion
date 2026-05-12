"""fase15_roles_usuarios_rol_direcciones_entrega

Revision ID: 20260512_fase15
Revises: fc0a5d81578e
Create Date: 2026-05-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260512_fase15'
down_revision: Union[str, Sequence[str], None] = 'fc0a5d81578e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Crear tabla roles
    op.execute("""
        CREATE TABLE IF NOT EXISTS roles (
            codigo VARCHAR(30) PRIMARY KEY,
            nombre VARCHAR(100) UNIQUE NOT NULL,
            descripcion TEXT
        )
    """)

    # 2. Crear tabla usuario_rol
    op.execute("""
        CREATE TABLE IF NOT EXISTS usuario_rol (
            usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            rol_codigo VARCHAR(30) NOT NULL REFERENCES roles(codigo) ON DELETE CASCADE,
            PRIMARY KEY (usuario_id, rol_codigo)
        )
    """)

    # 3. Crear tabla direcciones_entrega
    op.execute("""
        CREATE TABLE IF NOT EXISTS direcciones_entrega (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            direccion TEXT NOT NULL,
            ciudad VARCHAR(100) NOT NULL,
            provincia VARCHAR(100) NOT NULL,
            codigo_postal VARCHAR(20),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )
    """)

    # 4. Modificar tabla orders
    op.execute("""
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS direccion_entrega_id INTEGER
        REFERENCES direcciones_entrega(id) ON DELETE SET NULL
    """)
    op.execute("""
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS direccion_snapshot JSONB
    """)

    # 5. Índices
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_direcciones_usuario_id
        ON direcciones_entrega (usuario_id)
    """)


def downgrade() -> None:
    op.execute('DROP INDEX IF EXISTS idx_direcciones_usuario_id')
    op.execute('ALTER TABLE orders DROP COLUMN IF EXISTS direccion_snapshot')
    op.execute('ALTER TABLE orders DROP COLUMN IF EXISTS direccion_entrega_id')
    op.execute('DROP TABLE IF EXISTS direcciones_entrega CASCADE')
    op.execute('DROP TABLE IF EXISTS usuario_rol CASCADE')
    op.execute('DROP TABLE IF EXISTS roles CASCADE')
