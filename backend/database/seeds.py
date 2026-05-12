"""Database seeds (idempotent).

This module intentionally uses raw SQL with ON CONFLICT DO NOTHING so running it
multiple times is safe.
"""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def seed_estados_pedido(session: AsyncSession) -> None:
    estados: list[tuple[str, str, bool]] = [
        ("PENDIENTE", "Pedido creado, esperando pago", False),
        ("PAGO_PENDIENTE", "Esperando confirmacion de pago", False),
        ("PAGADO", "Pago confirmado", False),
        ("CONFIRMADO", "Confirmado por el local", False),
        ("PREPARANDO", "En preparacion", False),
        ("LISTO", "Listo para entrega", False),
        ("ENTREGADO", "Entregado al cliente", True),
        ("CANCELADO", "Cancelado", True),
    ]

    await session.execute(
        text(
            """
            INSERT INTO estados_pedido (codigo, descripcion, es_terminal)
            VALUES (:codigo, :descripcion, :es_terminal)
            ON CONFLICT (codigo) DO NOTHING
            """
        ),
        [
            {"codigo": c, "descripcion": d, "es_terminal": t}
            for (c, d, t) in estados
        ],
    )


async def seed_formas_pago(session: AsyncSession) -> None:
    formas: list[tuple[str, str, bool]] = [
        ("MP_CREDIT", "Tarjeta de credito via MercadoPago", True),
        ("MP_DEBIT", "Tarjeta de debito via MercadoPago", True),
    ]

    await session.execute(
        text(
            """
            INSERT INTO formas_pago (codigo, nombre, habilitado)
            VALUES (:codigo, :nombre, :habilitado)
            ON CONFLICT (codigo) DO NOTHING
            """
        ),
        [{"codigo": c, "nombre": n, "habilitado": h} for (c, n, h) in formas],
    )


async def run_seeds(session: AsyncSession) -> None:
    """Run all seeds.

    Caller decides transaction boundaries.
    """

    await seed_estados_pedido(session)
    await seed_formas_pago(session)
