"""erd_v5_tables_relations_and_payments

Revision ID: 852ada184dd7
Revises: 1b4b6e96df92
Create Date: 2026-05-11 20:24:32.060939

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '852ada184dd7'
down_revision: Union[str, Sequence[str], None] = '1b4b6e96df92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Use pgcrypto for gen_random_uuid() used in UUID server defaults.
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    # producto_ingredientes (association)
    op.create_table(
        "producto_ingredientes",
        sa.Column(
            "producto_id",
            sa.Integer(),
            sa.ForeignKey("products.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "ingrediente_id",
            sa.Integer(),
            sa.ForeignKey("ingredientes.id"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint(
            "producto_id",
            "ingrediente_id",
            name="pk_producto_ingredientes",
        ),
    )

    # historial_estados_pedido (append-only; no updated_at)
    op.create_table(
        "historial_estados_pedido",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "pedido_id",
            sa.Integer(),
            sa.ForeignKey("orders.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "estado_desde",
            sa.String(30),
            sa.ForeignKey("estados_pedido.codigo"),
            nullable=True,
        ),
        sa.Column(
            "estado_hasta",
            sa.String(30),
            sa.ForeignKey("estados_pedido.codigo"),
            nullable=False,
        ),
        sa.Column(
            "usuario_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("motivo", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "idx_historial_pedido_id",
        "historial_estados_pedido",
        ["pedido_id"],
        unique=False,
    )

    # pagos
    op.create_table(
        "pagos",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "pedido_id",
            sa.Integer(),
            sa.ForeignKey("orders.id"),
            nullable=False,
        ),
        sa.Column("mp_payment_id", sa.String(100), nullable=True),
        sa.Column("mp_status", sa.String(50), nullable=True),
        sa.Column("mp_status_detail", sa.String(100), nullable=True),
        sa.Column(
            "external_reference",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "idempotency_key",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("monto", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "forma_pago_codigo",
            sa.String(30),
            sa.ForeignKey("formas_pago.codigo"),
            nullable=True,
        ),
        sa.Column("mp_raw_response", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("mp_payment_id", name="uq_pagos_mp_payment_id"),
        sa.UniqueConstraint("idempotency_key", name="uq_pagos_idempotency_key"),
    )
    op.create_index(
        "idx_pagos_pedido_id",
        "pagos",
        ["pedido_id"],
        unique=False,
    )
    op.create_index(
        "idx_pagos_mp_payment_id",
        "pagos",
        ["mp_payment_id"],
        unique=False,
    )

    # Order.estado_codigo (FK to estados_pedido)
    op.add_column(
        "orders",
        sa.Column("estado_codigo", sa.String(30), nullable=True),
    )
    op.create_foreign_key(
        "fk_orders_estado_codigo",
        "orders",
        "estados_pedido",
        ["estado_codigo"],
        ["codigo"],
        ondelete="RESTRICT",
    )
    op.create_index(
        "ix_orders_estado_codigo",
        "orders",
        ["estado_codigo"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_orders_estado_codigo", table_name="orders")
    op.drop_constraint("fk_orders_estado_codigo", "orders", type_="foreignkey")
    op.drop_column("orders", "estado_codigo")

    op.drop_index("idx_pagos_mp_payment_id", table_name="pagos")
    op.drop_index("idx_pagos_pedido_id", table_name="pagos")
    op.drop_table("pagos")

    op.drop_index("idx_historial_pedido_id", table_name="historial_estados_pedido")
    op.drop_table("historial_estados_pedido")

    op.drop_table("producto_ingredientes")
