"""erd_v5_soft_delete_snapshots_and_drop_stripe

Revision ID: e89eb1c5692e
Revises: 852ada184dd7
Create Date: 2026-05-11 20:24:36.715223

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'e89eb1c5692e'
down_revision: Union[str, Sequence[str], None] = '852ada184dd7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Soft delete columns
    op.add_column(
        "products",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "categories",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    # users.deleted_at already exists from ef4db7379531

    # OrderItem snapshots
    op.add_column(
        "order_items",
        sa.Column("nombre_snapshot", sa.String(255), nullable=True),
    )
    op.add_column(
        "order_items",
        sa.Column("precio_snapshot", sa.Numeric(12, 2), nullable=True),
    )

    # Drop Stripe columns (schema reality: both exist from ea394614e58a)
    op.drop_index("ix_orders_stripe_payment_intent_id", table_name="orders")
    op.drop_column("orders", "stripe_payment_intent_id")
    op.drop_column("orders", "stripe_customer_id")
    op.drop_column("users", "stripe_customer_id")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "users",
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("stripe_payment_intent_id", sa.String(255), nullable=True),
    )
    op.create_index(
        "ix_orders_stripe_payment_intent_id",
        "orders",
        ["stripe_payment_intent_id"],
        unique=False,
        postgresql_using="btree",
    )

    op.drop_column("order_items", "precio_snapshot")
    op.drop_column("order_items", "nombre_snapshot")

    op.drop_column("categories", "deleted_at")
    op.drop_column("products", "deleted_at")
