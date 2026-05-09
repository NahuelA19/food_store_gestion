"""add_notifications_table

Revision ID: 5c328891b926
Revises: 20260509_add_wishlist
Create Date: 2026-05-09 20:53:09.962079

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '5c328891b926'
down_revision: Union[str, Sequence[str], None] = '20260509_add_wishlist'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create notifications table."""
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('related_order_id', sa.Integer(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['related_order_id'], ['orders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_notifications_is_read'), 'notifications', ['is_read'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index('ix_notifications_user_read', 'notifications', ['user_id', 'is_read'], unique=False)


def downgrade() -> None:
    """Drop notifications table."""
    op.drop_index('ix_notifications_user_read', table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_is_read'), table_name='notifications')
    op.drop_table('notifications')
