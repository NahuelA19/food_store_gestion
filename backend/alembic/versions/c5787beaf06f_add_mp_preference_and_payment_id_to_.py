"""add_mp_preference_and_payment_id_to_orders

Revision ID: c5787beaf06f
Revises: a22e1efada61
Create Date: 2026-05-13 22:17:19.762599

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5787beaf06f'
down_revision: Union[str, Sequence[str], None] = 'a22e1efada61'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add MercadoPago columns to orders table
    op.add_column(
        'orders',
        sa.Column('mp_preference_id', sa.String(255), nullable=True)
    )
    op.add_column(
        'orders',
        sa.Column('mp_payment_id', sa.String(255), nullable=True)
    )
    # Create indexes for these columns
    op.create_index(
        op.f('ix_orders_mp_preference_id'),
        'orders',
        ['mp_preference_id'],
        unique=False
    )
    op.create_index(
        op.f('ix_orders_mp_payment_id'),
        'orders',
        ['mp_payment_id'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index(op.f('ix_orders_mp_payment_id'), table_name='orders')
    op.drop_index(op.f('ix_orders_mp_preference_id'), table_name='orders')
    # Drop columns
    op.drop_column('orders', 'mp_payment_id')
    op.drop_column('orders', 'mp_preference_id')
