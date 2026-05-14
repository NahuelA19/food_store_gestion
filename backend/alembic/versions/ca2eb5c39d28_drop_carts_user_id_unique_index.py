"""drop_carts_user_id_unique_index

Revision ID: ca2eb5c39d28
Revises: e8302970a7e8
Create Date: 2026-05-14 00:18:57.929969

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ca2eb5c39d28'
down_revision: Union[str, Sequence[str], None] = 'e8302970a7e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop the unique index on carts.user_id and replace with a non-unique index
    op.drop_index('ix_carts_user_id', table_name='carts')
    op.create_index('ix_carts_user_id', 'carts', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Re-create the unique index
    op.drop_index('ix_carts_user_id', table_name='carts')
    op.create_index('ix_carts_user_id', 'carts', ['user_id'], unique=True)
