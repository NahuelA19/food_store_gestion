"""Add wishlist_items table.

Revision ID: 20260509_add_wishlist
Revises: 20260509_add_reviews
Create Date: 2026-05-09 19:50:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260509_add_wishlist"
down_revision: Union[str, Sequence[str], None] = "20260509_add_reviews"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: create wishlist_items table."""
    op.create_table(
        "wishlist_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),
    )
    op.create_index(op.f("ix_wishlist_user_id"), "wishlist_items", ["user_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema: drop wishlist_items table."""
    op.drop_index(op.f("ix_wishlist_user_id"), table_name="wishlist_items")
    op.drop_table("wishlist_items")
