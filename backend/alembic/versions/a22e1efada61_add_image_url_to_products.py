"""add_image_url_to_products

Revision ID: a22e1efada61
Revises: 20260512_fase15
Create Date: 2026-05-12 11:12:51.677763

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a22e1efada61'
down_revision: Union[str, Sequence[str], None] = '20260512_fase15'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('products', sa.Column('image_url', sa.String(length=2048), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('products', 'image_url')
