"""Add user profiles and preferences.

Revision ID: ef4db7379531
Revises: 1c78cfd1cfce
Create Date: 2026-05-07 12:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'ef4db7379531'
down_revision: Union[str, Sequence[str], None] = '1c78cfd1cfce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add profile columns to users table
    op.add_column('users', sa.Column('first_name', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('last_name', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

    # Create composite index on (is_active, created_at) for admin user listing
    op.create_index('ix_users_is_active_created_at', 'users', ['is_active', 'created_at'], unique=False)

    # Create user_preferences table
    op.create_table(
        'user_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('pref_key', sa.String(50), nullable=False),
        sa.Column('pref_value', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'pref_key', name='uq_user_pref_key'),
    )
    op.create_index(op.f('ix_user_preferences_user_id'), 'user_preferences', ['user_id'], unique=False)
    op.create_index('ix_user_preferences_user_pref_key', 'user_preferences', ['user_id', 'pref_key'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop user_preferences table
    op.drop_index('ix_user_preferences_user_pref_key', table_name='user_preferences')
    op.drop_index(op.f('ix_user_preferences_user_id'), table_name='user_preferences')
    op.drop_table('user_preferences')

    # Drop index from users table
    op.drop_index('ix_users_is_active_created_at', table_name='users')

    # Drop columns from users table
    op.drop_column('users', 'deleted_at')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'first_name')
