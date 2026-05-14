"""update_orderstatus_enum_values

Revision ID: 33d17aef4970
Revises: 2b18371d8cb1
Create Date: 2026-05-13 22:26:06.754836

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '33d17aef4970'
down_revision: Union[str, Sequence[str], None] = '2b18371d8cb1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Remove default value before dropping enum
    op.execute("ALTER TABLE orders ALTER COLUMN status DROP DEFAULT")
    
    # Convert status column to VARCHAR temporarily
    op.execute("ALTER TABLE orders ALTER COLUMN status TYPE VARCHAR(30)")
    
    # Drop the old orderstatus enum type with cascade
    op.execute("DROP TYPE orderstatus CASCADE")
    
    # Create the new orderstatus enum with all required values
    op.execute("""
        CREATE TYPE orderstatus AS ENUM (
            'pendiente',
            'pending',
            'pago_pendiente',
            'payment_pending',
            'pagado',
            'paid',
            'pago_fallido',
            'payment_failed',
            'confirmado',
            'confirmed',
            'en_prep',
            'en_camino',
            'shipped',
            'preparando',
            'listo',
            'entregado',
            'delivered',
            'cancelado',
            'cancelled'
        )
    """)
    
    # Convert the status column back to the new enum type
    op.execute("""
        ALTER TABLE orders 
        ALTER COLUMN status 
        TYPE orderstatus 
        USING status::orderstatus
    """)
    
    # Set the default value again
    op.execute("ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'payment_pending'::orderstatus")


def downgrade() -> None:
    """Downgrade schema."""
    # Remove default value
    op.execute("ALTER TABLE orders ALTER COLUMN status DROP DEFAULT")
    
    # Convert to VARCHAR
    op.execute("ALTER TABLE orders ALTER COLUMN status TYPE VARCHAR(30)")
    
    # Drop the new orderstatus enum type
    op.execute("DROP TYPE orderstatus CASCADE")
    
    # Create old enum
    op.execute("""
        CREATE TYPE orderstatus AS ENUM (
            'pending',
            'confirmed',
            'shipped',
            'delivered',
            'cancelled'
        )
    """)
    
    # Convert back
    op.execute("""
        ALTER TABLE orders 
        ALTER COLUMN status 
        TYPE orderstatus 
        USING status::orderstatus
    """)
    
    # Set old default
    op.execute("ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'::orderstatus")
