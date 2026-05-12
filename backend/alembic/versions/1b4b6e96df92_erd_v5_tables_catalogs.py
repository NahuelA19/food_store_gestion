"""erd_v5_tables_catalogs

Revision ID: 1b4b6e96df92
Revises: 5c328891b926
Create Date: 2026-05-11 20:22:58.668776

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = '1b4b6e96df92'
down_revision: Union[str, Sequence[str], None] = '5c328891b926'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # refresh_tokens
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("token_hash", sa.String(255), nullable=False),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("device_info", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "idx_refresh_tokens_user_id",
        "refresh_tokens",
        ["user_id"],
        unique=False,
    )
    # Unique index satisfies token_hash UNIQUE requirement and provides the requested index name.
    op.create_index(
        "idx_refresh_tokens_hash",
        "refresh_tokens",
        ["token_hash"],
        unique=True,
    )

    # ingredientes
    op.create_table(
        "ingredientes",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column(
            "es_alergeno",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("nombre", name="uq_ingredientes_nombre"),
    )

    # formas_pago
    op.create_table(
        "formas_pago",
        sa.Column("codigo", sa.String(30), primary_key=True, nullable=False),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column(
            "habilitado",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # estados_pedido
    op.create_table(
        "estados_pedido",
        sa.Column("codigo", sa.String(30), primary_key=True, nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column(
            "es_terminal",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("estados_pedido")
    op.drop_table("formas_pago")
    op.drop_table("ingredientes")
    op.drop_index("idx_refresh_tokens_hash", table_name="refresh_tokens")
    op.drop_index("idx_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
