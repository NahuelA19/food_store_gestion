"""add_listo_estado_pedido

Revision ID: 20260518_add_listo
Revises: 20260518_must_change_pw
Create Date: 2026-05-18

"""
from typing import Sequence, Union

from alembic import op


revision: str = '20260518_add_listo'
down_revision: Union[str, Sequence[str], None] = '20260518_must_change_pw'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO estados_pedido (codigo, descripcion, es_terminal)
        VALUES ('LISTO', 'Preparación finalizada, listo para despachar', false)
        ON CONFLICT (codigo) DO NOTHING
    """)


def downgrade() -> None:
    op.execute("DELETE FROM estados_pedido WHERE codigo = 'LISTO'")
