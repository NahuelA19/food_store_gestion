"""Add status_history column to orders table.

Revision ID: 9df7a8414728
Revises: 20260508112112
Create Date: 2026-05-08 17:50:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9df7a8414728"
down_revision: Union[str, Sequence[str], None] = "20260508112112"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add status_history JSON column to orders table."""
    op.add_column(
        "orders",
        sa.Column("status_history", JSON, nullable=True),
    )


def downgrade() -> None:
    """Remove status_history column from orders table."""
    op.drop_column("orders", "status_history")
