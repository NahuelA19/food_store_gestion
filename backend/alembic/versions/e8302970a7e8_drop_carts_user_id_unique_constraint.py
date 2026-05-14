"""drop_carts_user_id_unique_constraint

Revision ID: e8302970a7e8
Revises: 33d17aef4970
Create Date: 2026-05-14 00:12:56.304276

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8302970a7e8'
down_revision: Union[str, Sequence[str], None] = '33d17aef4970'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop the unique constraint on carts.user_id to allow multiple carts per user
    op.drop_constraint('carts_user_id_key', 'carts', type_='unique')


def downgrade() -> None:
    """Downgrade schema."""
    # Re-add the unique constraint
    op.create_unique_constraint('carts_user_id_key', 'carts', ['user_id'])
