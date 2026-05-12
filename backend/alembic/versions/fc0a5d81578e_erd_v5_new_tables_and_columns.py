"""erd_v5_new_tables_and_columns

Revision ID: fc0a5d81578e
Revises: e89eb1c5692e
Create Date: 2026-05-11 22:02:43.750219

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc0a5d81578e'
down_revision: Union[str, Sequence[str], None] = 'e89eb1c5692e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Crear tablas maestras
    op.execute('CREATE TABLE IF NOT EXISTS ingredientes (id SERIAL PRIMARY KEY, nombre VARCHAR(100) UNIQUE NOT NULL, es_alergeno BOOLEAN DEFAULT false NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL)')
    op.execute('CREATE TABLE IF NOT EXISTS formas_pago (codigo VARCHAR(50) PRIMARY KEY, nombre VARCHAR(100) NOT NULL, habilitado BOOLEAN DEFAULT true NOT NULL)')
    op.execute('CREATE TABLE IF NOT EXISTS estados_pedido (codigo VARCHAR(50) PRIMARY KEY, descripcion VARCHAR(255), es_terminal BOOLEAN DEFAULT false NOT NULL)')

    # 2. Crear tablas de asociación y transaccionales
    op.execute('CREATE TABLE IF NOT EXISTS refresh_tokens (id SERIAL PRIMARY KEY, token_hash VARCHAR(255) UNIQUE NOT NULL, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TIMESTAMP WITH TIME ZONE NOT NULL, revoked_at TIMESTAMP WITH TIME ZONE, device_info VARCHAR(255), created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL)')
    op.execute('CREATE TABLE IF NOT EXISTS producto_ingredientes (producto_id INTEGER REFERENCES products(id) ON DELETE CASCADE, ingrediente_id INTEGER REFERENCES ingredientes(id) ON DELETE CASCADE, PRIMARY KEY (producto_id, ingrediente_id))')
    op.execute('CREATE TABLE IF NOT EXISTS historial_estados_pedido (id SERIAL PRIMARY KEY, pedido_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, estado_desde VARCHAR(50) REFERENCES estados_pedido(codigo), estado_hasta VARCHAR(50) NOT NULL REFERENCES estados_pedido(codigo), usuario_id INTEGER REFERENCES users(id) ON DELETE SET NULL, motivo VARCHAR(255), created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL)')
    op.execute('CREATE TABLE IF NOT EXISTS pagos (id SERIAL PRIMARY KEY, pedido_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, mp_payment_id VARCHAR(100) UNIQUE, mp_status VARCHAR(50), external_reference UUID DEFAULT gen_random_uuid() NOT NULL, idempotency_key UUID UNIQUE DEFAULT gen_random_uuid() NOT NULL, monto NUMERIC(12,2) NOT NULL, forma_pago_codigo VARCHAR(50) NOT NULL REFERENCES formas_pago(codigo), mp_raw_response JSONB, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL)')

    # 3. Modificar tablas existentes
    op.execute('ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE')
    op.execute('ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE')
    op.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE')
    op.execute('ALTER TABLE order_items ADD COLUMN IF NOT EXISTS nombre_snapshot VARCHAR(255)')
    op.execute('ALTER TABLE order_items ADD COLUMN IF NOT EXISTS precio_snapshot NUMERIC(12,2)')
    
    op.execute('ALTER TABLE orders DROP COLUMN IF EXISTS stripe_payment_intent_id')
    op.execute('ALTER TABLE orders DROP COLUMN IF EXISTS stripe_customer_id')
    op.execute('ALTER TABLE orders ADD COLUMN IF NOT EXISTS estado_codigo VARCHAR(50) REFERENCES estados_pedido(codigo)')
    op.execute('ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id')

    # 4. Agregar Índices (si no existen)
    # Nota: PostgreSQL no tiene CREATE INDEX IF NOT EXISTS antes de la v9.5, pero asumimos soporte.
    op.execute('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id)')
    op.execute('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens (token_hash)')
    op.execute('CREATE INDEX IF NOT EXISTS idx_historial_pedido_id ON historial_estados_pedido (pedido_id)')
    op.execute('CREATE INDEX IF NOT EXISTS idx_pagos_pedido_id ON pagos (pedido_id)')
    op.execute('CREATE INDEX IF NOT EXISTS idx_pagos_mp_payment_id ON pagos (mp_payment_id)')


def downgrade() -> None:
    # Downgrade opuesto
    op.execute('DROP INDEX IF EXISTS idx_pagos_mp_payment_id')
    op.execute('DROP INDEX IF EXISTS idx_pagos_pedido_id')
    op.execute('DROP INDEX IF EXISTS idx_historial_pedido_id')
    op.execute('DROP INDEX IF EXISTS idx_refresh_tokens_hash')
    op.execute('DROP INDEX IF EXISTS idx_refresh_tokens_user_id')

    op.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)')
    op.execute('ALTER TABLE orders DROP COLUMN IF EXISTS estado_codigo')
    op.execute('ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)')
    op.execute('ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255)')

    op.execute('ALTER TABLE order_items DROP COLUMN IF EXISTS precio_snapshot')
    op.execute('ALTER TABLE order_items DROP COLUMN IF EXISTS nombre_snapshot')
    op.execute('ALTER TABLE users DROP COLUMN IF EXISTS deleted_at')
    op.execute('ALTER TABLE categories DROP COLUMN IF EXISTS deleted_at')
    op.execute('ALTER TABLE products DROP COLUMN IF EXISTS deleted_at')

    op.execute('DROP TABLE IF EXISTS pagos CASCADE')
    op.execute('DROP TABLE IF EXISTS historial_estados_pedido CASCADE')
    op.execute('DROP TABLE IF EXISTS producto_ingredientes CASCADE')
    op.execute('DROP TABLE IF EXISTS refresh_tokens CASCADE')
    op.execute('DROP TABLE IF EXISTS estados_pedido CASCADE')
    op.execute('DROP TABLE IF EXISTS formas_pago CASCADE')
    op.execute('DROP TABLE IF EXISTS ingredientes CASCADE')
