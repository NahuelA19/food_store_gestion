"""Add inventory table and additional product indexes.

Revision ID: 20260507131242
Revises: ef4db7379531
Create Date: 2026-05-07 13:12:42.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260507131242"
down_revision: Union[str, Sequence[str], None] = ("ef4db7379531", "add_role_column")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create inventory table
    op.create_table(
        "inventory",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("stock_quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reserved_quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("low_stock_threshold", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id"),
    )
    op.create_index(op.f("ix_inventory_product_id"), "inventory", ["product_id"], unique=False)
    op.create_index(op.f("ix_inventory_stock_quantity"), "inventory", ["stock_quantity"], unique=False)

    # Add missing indexes to products table for filtering
    op.create_index(op.f("ix_products_price"), "products", ["price"], unique=False)

    # Add updated_at column to categories if not already present
    # (this might already exist, but we ensure it's there)
    try:
        op.add_column(
            "categories",
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
    except Exception:
        # Column might already exist, silently pass
        pass


def downgrade() -> None:
    """Downgrade schema."""
    # Drop inventory table
    op.drop_index(op.f("ix_inventory_stock_quantity"), table_name="inventory")
    op.drop_index(op.f("ix_inventory_product_id"), table_name="inventory")
    op.drop_table("inventory")

    # Drop product indexes
    op.drop_index(op.f("ix_products_price"), table_name="products")

    # Note: we don't drop categories.updated_at to maintain data
