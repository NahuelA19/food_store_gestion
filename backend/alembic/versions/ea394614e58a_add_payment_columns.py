"""Add payment columns to orders and users tables.

Revision ID: ea394614e58a
Revises: 9df7a8414728
Create Date: 2026-05-08 18:30:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ea394614e58a"
down_revision: Union[str, Sequence[str], None] = "9df7a8414728"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add payment columns to orders and stripe_customer_id to users."""
    # Add payment columns to orders table
    op.add_column(
        "orders",
        sa.Column("payment_status", sa.String(20), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("stripe_payment_intent_id", sa.String(255), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("payment_method", sa.String(50), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Add index for payment intent lookups
    op.create_index(
        "ix_orders_stripe_payment_intent_id",
        "orders",
        ["stripe_payment_intent_id"],
        postgresql_using="btree",
    )

    # Add stripe_customer_id to users
    op.add_column(
        "users",
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    """Remove payment columns."""
    op.drop_column("users", "stripe_customer_id")
    op.drop_index("ix_orders_stripe_payment_intent_id")
    op.drop_column("orders", "paid_at")
    op.drop_column("orders", "payment_method")
    op.drop_column("orders", "stripe_customer_id")
    op.drop_column("orders", "stripe_payment_intent_id")
    op.drop_column("orders", "payment_status")
