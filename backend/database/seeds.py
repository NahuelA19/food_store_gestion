"""Database seeds (idempotent). Uses raw SQL with ON CONFLICT DO NOTHING."""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.security.password import get_password_hash


async def seed_estados_pedido(session: AsyncSession) -> None:
    estados: list[tuple[str, str, bool]] = [
        ("PENDIENTE", "Pedido creado, esperando pago", False),
        ("CONFIRMADO", "Pago confirmado, pedido aceptado", False),
        ("EN_PREP", "En preparación", False),
        ("EN_CAMINO", "En camino al cliente", False),
        ("ENTREGADO", "Entregado al cliente", True),
        ("CANCELADO", "Cancelado", True),
    ]
    await session.execute(
        text("""
            INSERT INTO estados_pedido (codigo, descripcion, es_terminal)
            VALUES (:codigo, :descripcion, :es_terminal)
            ON CONFLICT (codigo) DO NOTHING
        """),
        [{"codigo": c, "descripcion": d, "es_terminal": t} for (c, d, t) in estados],
    )


async def seed_formas_pago(session: AsyncSession) -> None:
    formas: list[tuple[str, str, bool]] = [
        ("MERCADOPAGO", "MercadoPago (tarjeta/débito)", True),
        ("EFECTIVO", "Pago en efectivo contra entrega", True),
        ("TRANSFERENCIA", "Transferencia bancaria", True),
    ]
    await session.execute(
        text("""
            INSERT INTO formas_pago (codigo, nombre, habilitado)
            VALUES (:codigo, :nombre, :habilitado)
            ON CONFLICT (codigo) DO NOTHING
        """),
        [{"codigo": c, "nombre": n, "habilitado": h} for (c, n, h) in formas],
    )


async def seed_roles(session: AsyncSession) -> None:
    roles: list[tuple[str, str, str]] = [
        ("ADMIN", "Administrador", "Acceso total al sistema"),
        ("STOCK", "Gestor de stock", "Gestiona productos e ingredientes"),
        ("PEDIDOS", "Gestor de pedidos", "Gestiona pedidos y entregas"),
        ("CLIENT", "Cliente", "Compra productos y consulta pedidos"),
    ]
    await session.execute(
        text("""
            INSERT INTO roles (codigo, nombre, descripcion)
            VALUES (:codigo, :nombre, :descripcion)
            ON CONFLICT (codigo) DO NOTHING
        """),
        [{"codigo": c, "nombre": n, "descripcion": d} for (c, n, d) in roles],
    )


async def seed_admin_user(session: AsyncSession) -> None:
    """Create admin user and assign ADMIN role."""
    hashed = get_password_hash("admin123")
    result = await session.execute(
        text("""
            INSERT INTO users (email, hashed_password, is_active, role, first_name, last_name, phone)
            VALUES (:email, :password, true, 'admin', 'Admin', 'FoodStore', '+5491112345678')
            ON CONFLICT (email) DO UPDATE SET is_active = TRUE
            RETURNING id
        """),
        {"email": "admin@foodstore.com", "password": hashed},
    )
    row = result.fetchone()
    if row:
        admin_id = row[0]
        await session.execute(
            text("""
                INSERT INTO usuario_rol (usuario_id, rol_codigo)
                VALUES (:uid, 'ADMIN')
                ON CONFLICT (usuario_id, rol_codigo) DO NOTHING
            """),
            {"uid": admin_id},
        )


async def run_seeds(session: AsyncSession) -> None:
    await seed_estados_pedido(session)
    await seed_formas_pago(session)
    await seed_roles(session)
    await seed_admin_user(session)
