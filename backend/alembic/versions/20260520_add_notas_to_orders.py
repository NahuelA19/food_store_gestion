"""Add notas column to orders table.

Revision ID: 20260520_add_notas_to_orders
Revises: fc0a5d81578e
Create Date: 2026-05-20 20:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TEXT

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260520_add_notas_to_orders"
down_revision: Union[str, Sequence[str], None] = "20260518_add_listo"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add notas column to orders table."""
    op.add_column(
        "orders",
        sa.Column("notas", sa.Text, nullable=True),
    )


def downgrade() -> None:
    """Remove notas column from orders table."""
    op.drop_column("orders", "notas")
