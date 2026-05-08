"""Add FTS5 search index on products table.

Revision ID: 20260508003720
Revises: 20260507131242
Create Date: 2026-05-08 00:37:20.000000

"""
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = '20260508003720'
down_revision = '20260507131242'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add search_vector column, GIN index, and trigger for FTS."""

    # 1. Add search_vector column (tsvector type)
    op.add_column(
        'products',
        sa.Column(
            'search_vector',
            postgresql.TSVECTOR,
            nullable=True
        )
    )

    # 2. Populate existing rows with search vectors
    op.execute("""
        UPDATE products
        SET search_vector =
            to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
    """)

    # 3. Create GIN index on search_vector for fast FTS queries
    op.create_index(
        'idx_products_search_vector',
        'products',
        ['search_vector'],
        postgresql_using='gin'
    )

    # 4. Create trigger to auto-update search_vector on INSERT/UPDATE
    op.execute("""
        CREATE TRIGGER products_search_vector_update
        BEFORE INSERT OR UPDATE ON products
        FOR EACH ROW
        EXECUTE FUNCTION tsvector_update_trigger(
            search_vector, 'pg_catalog.english', name, description
        )
    """)


def downgrade() -> None:
    """Revert FTS changes."""

    # 1. Drop trigger
    op.execute("DROP TRIGGER IF EXISTS products_search_vector_update ON products")

    # 2. Drop GIN index
    op.drop_index('idx_products_search_vector', table_name='products')

    # 3. Drop search_vector column
    op.drop_column('products', 'search_vector')
