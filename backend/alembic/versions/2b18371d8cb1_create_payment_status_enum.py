"""create_payment_status_enum

Revision ID: 2b18371d8cb1
Revises: c5787beaf06f
Create Date: 2026-05-13 22:21:36.182491

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b18371d8cb1'
down_revision: Union[str, Sequence[str], None] = 'c5787beaf06f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create PaymentStatus enum type
    op.execute("""
        CREATE TYPE paymentstatus AS ENUM (
            'pending',
            'succeeded',
            'failed',
            'refunded',
            'approved'
        )
    """)
    
    # Alter column to use the new enum type
    op.execute("""
        ALTER TABLE orders 
        ALTER COLUMN payment_status 
        TYPE paymentstatus 
        USING payment_status::paymentstatus
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Revert column to string type
    op.execute("""
        ALTER TABLE orders 
        ALTER COLUMN payment_status 
        TYPE VARCHAR(20)
    """)
    
    # Drop the enum type
    op.execute("DROP TYPE paymentstatus")
