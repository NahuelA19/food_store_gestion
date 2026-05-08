"""Create carts and cart_items tables.

Revision ID: 20260508112112
Revises: 20260508003720
Create Date: 2026-05-08 11:21:12.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260508112112"
down_revision: Union[str, Sequence[str], None] = "20260508003720"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: create carts and cart_items tables."""
    # Create cart status enum type (IF NOT EXISTS via raw SQL)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cartstatus') THEN
                CREATE TYPE cartstatus AS ENUM ('active', 'checked_out');
            END IF;
        END
        $$;
    """)

    # Create carts table
    op.create_table(
        "carts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="active",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_carts_user_id"), "carts", ["user_id"], unique=True)
    op.create_index(op.f("ix_carts_status"), "carts", ["status"], unique=False)

    # Create cart_items table
    op.create_table(
        "cart_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("cart_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["cart_id"], ["carts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cart_id", "product_id"),
    )
    op.create_index(op.f("ix_cart_items_cart_id"), "cart_items", ["cart_id"], unique=False)
    op.create_index(
        op.f("ix_cart_items_product_id"), "cart_items", ["product_id"], unique=False
    )
    op.create_index(
        op.f("ix_cart_items_cart_product"),
        "cart_items",
        ["cart_id", "product_id"],
        unique=True,
    )

    # Add cart_id column to users table
    op.add_column("users", sa.Column("cart_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_users_cart_id", "users", "carts", ["cart_id"], ["id"], ondelete="SET NULL"
    )
    op.create_index(op.f("ix_users_cart_id"), "users", ["cart_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema: remove carts and cart_items tables."""
    # Remove users.cart_id column and its index
    op.drop_index(op.f("ix_users_cart_id"), table_name="users")
    op.drop_constraint("fk_users_cart_id", "users", type_="foreignkey")
    op.drop_column("users", "cart_id")

    # Drop cart_items table
    op.drop_index(op.f("ix_cart_items_cart_product"), table_name="cart_items")
    op.drop_index(op.f("ix_cart_items_product_id"), table_name="cart_items")
    op.drop_index(op.f("ix_cart_items_cart_id"), table_name="cart_items")
    op.drop_table("cart_items")

    # Drop carts table
    op.drop_index(op.f("ix_carts_status"), table_name="carts")
    op.drop_index(op.f("ix_carts_user_id"), table_name="carts")
    op.drop_table("carts")

    # Drop cart status enum type (IF EXISTS)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cartstatus') THEN
                DROP TYPE cartstatus;
            END IF;
        END
        $$;
    """)
