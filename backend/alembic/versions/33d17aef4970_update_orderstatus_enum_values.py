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
    
    # Normalize existing data: convert old lowercase enum values to UPPERCASE names
    op.execute("""
        UPDATE orders SET status = 'PENDIENTE' WHERE LOWER(status) = 'pendiente'
    """)
    op.execute("""
        UPDATE orders SET status = 'PENDING' WHERE LOWER(status) = 'pending'
    """)
    op.execute("""
        UPDATE orders SET status = 'CONFIRMED' WHERE LOWER(status) = 'confirmed'
    """)
    op.execute("""
        UPDATE orders SET status = 'SHIPPED' WHERE LOWER(status) = 'shipped'
    """)
    op.execute("""
        UPDATE orders SET status = 'DELIVERED' WHERE LOWER(status) = 'delivered'
    """)
    op.execute("""
        UPDATE orders SET status = 'CANCELLED' WHERE LOWER(status) = 'cancelled'
    """)
    op.execute("""
        UPDATE orders SET status = 'PAGADO' WHERE LOWER(status) = 'pagado'
    """)
    op.execute("""
        UPDATE orders SET status = 'EN_PREP' WHERE LOWER(status) = 'en_prep'
    """)
    op.execute("""
        UPDATE orders SET status = 'EN_CAMINO' WHERE LOWER(status) = 'en_camino'
    """)
    op.execute("""
        UPDATE orders SET status = 'CANCELADO' WHERE LOWER(status) = 'cancelado'
    """)
    op.execute("""
        UPDATE orders SET status = 'PAGO_PENDIENTE' WHERE LOWER(status) = 'pago_pendiente'
    """)
    op.execute("""
        UPDATE orders SET status = 'PAYMENT_PENDING' WHERE LOWER(status) = 'payment_pending'
    """)
    op.execute("""
        UPDATE orders SET status = 'PAGO_FALLIDO' WHERE LOWER(status) = 'pago_fallido'
    """)
    op.execute("""
        UPDATE orders SET status = 'PAYMENT_FAILED' WHERE LOWER(status) = 'payment_failed'
    """)
    op.execute("""
        UPDATE orders SET status = 'CONFIRMADO' WHERE LOWER(status) = 'confirmado'
    """)
    op.execute("""
        UPDATE orders SET status = 'PREPARANDO' WHERE LOWER(status) = 'preparando'
    """)
    op.execute("""
        UPDATE orders SET status = 'LISTO' WHERE LOWER(status) = 'listo'
    """)
    op.execute("""
        UPDATE orders SET status = 'ENTREGADO' WHERE LOWER(status) = 'entregado'
    """)
    op.execute("""
        UPDATE orders SET status = 'PAID' WHERE LOWER(status) = 'paid'
    """)
    
    # Create the new orderstatus enum with all required values (UPPERCASE = .name to match SQLAlchemy)
    op.execute("""
        CREATE TYPE orderstatus AS ENUM (
            'PENDIENTE',
            'PENDING',
            'PAGO_PENDIENTE',
            'PAYMENT_PENDING',
            'PAGADO',
            'PAID',
            'PAGO_FALLIDO',
            'PAYMENT_FAILED',
            'CONFIRMADO',
            'CONFIRMED',
            'EN_PREP',
            'EN_CAMINO',
            'SHIPPED',
            'PREPARANDO',
            'LISTO',
            'ENTREGADO',
            'DELIVERED',
            'CANCELADO',
            'CANCELLED'
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
    op.execute("ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'PAYMENT_PENDING'::orderstatus")


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
    op.execute("ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'::orderstatus")  # old value
