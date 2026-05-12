"""Tests for database seeding functions."""

import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from database.seeds import (
    seed_estados_pedido,
    seed_formas_pago,
    seed_roles,
    seed_admin_user,
    run_seeds,
)
from app.models.estado_pedido import EstadoPedido
from app.models.forma_pago import FormaPago
from app.models.role import Role
from app.models.user import User


@pytest.mark.asyncio
class TestSeedFunctions:
    """Test database seeding functions."""

    async def test_seed_estados_pedido_creates_six_states(
        self, db_session: AsyncSession
    ) -> None:
        """Test seed_estados_pedido creates exactly 6 estados_pedido records."""
        await seed_estados_pedido(db_session)
        await db_session.commit()

        # Query all estados
        result = await db_session.execute(select(EstadoPedido))
        estados = result.scalars().all()

        # Verify we have exactly 6 states
        assert len(estados) == 6

        # Verify all expected states exist
        estado_codigos = {e.codigo for e in estados}
        expected_codigos = {"PENDIENTE", "CONFIRMADO", "EN_PREP", "EN_CAMINO", "ENTREGADO", "CANCELADO"}
        assert estado_codigos == expected_codigos

    async def test_seed_estados_pedido_marks_terminal_states(
        self, db_session: AsyncSession
    ) -> None:
        """Test seed_estados_pedido correctly marks terminal states."""
        await seed_estados_pedido(db_session)
        await db_session.commit()

        result = await db_session.execute(select(EstadoPedido))
        estados = result.scalars().all()

        # Group by terminal status
        terminal_estados = {e.codigo for e in estados if e.es_terminal}
        non_terminal_estados = {e.codigo for e in estados if not e.es_terminal}

        # Verify terminal states
        assert terminal_estados == {"ENTREGADO", "CANCELADO"}

        # Verify non-terminal states
        assert non_terminal_estados == {"PENDIENTE", "CONFIRMADO", "EN_PREP", "EN_CAMINO"}

    async def test_seed_formas_pago_creates_three_payment_methods(
        self, db_session: AsyncSession
    ) -> None:
        """Test seed_formas_pago creates 3 payment methods."""
        await seed_formas_pago(db_session)
        await db_session.commit()

        result = await db_session.execute(select(FormaPago))
        formas = result.scalars().all()

        # Verify we have exactly 3 payment methods
        assert len(formas) == 3

        # Verify all expected methods exist
        forma_codigos = {f.codigo for f in formas}
        expected_codigos = {"MERCADOPAGO", "EFECTIVO", "TRANSFERENCIA"}
        assert forma_codigos == expected_codigos

    async def test_seed_formas_pago_all_enabled(
        self, db_session: AsyncSession
    ) -> None:
        """Test all payment methods are enabled after seeding."""
        await seed_formas_pago(db_session)
        await db_session.commit()

        result = await db_session.execute(select(FormaPago))
        formas = result.scalars().all()

        # Verify all are enabled
        assert all(f.habilitado for f in formas)

    async def test_seed_roles_creates_four_roles(
        self, db_session: AsyncSession
    ) -> None:
        """Test seed_roles creates 4 roles."""
        await seed_roles(db_session)
        await db_session.commit()

        result = await db_session.execute(select(Role))
        roles = result.scalars().all()

        # Verify we have exactly 4 roles
        assert len(roles) == 4

        # Verify expected role codes
        role_codigos = {r.codigo for r in roles}
        expected_codigos = {"ADMIN", "STOCK", "PEDIDOS", "CLIENT"}
        assert role_codigos == expected_codigos

    async def test_seed_roles_have_descriptions(
        self, db_session: AsyncSession
    ) -> None:
        """Test all roles have descriptions and names."""
        await seed_roles(db_session)
        await db_session.commit()

        result = await db_session.execute(select(Role))
        roles = result.scalars().all()

        # Verify all have names and descriptions
        for role in roles:
            assert role.nombre is not None
            assert len(role.nombre) > 0
            assert role.descripcion is not None
            assert len(role.descripcion) > 0

    async def test_seed_admin_user_creates_admin_user(
        self, db_session: AsyncSession
    ) -> None:
        """Test seed_admin_user creates admin user with admin role."""
        # First seed roles so admin role exists
        await seed_roles(db_session)
        await db_session.commit()

        # Then seed admin user
        await seed_admin_user(db_session)
        await db_session.commit()

        # Query admin user
        result = await db_session.execute(
            select(User).where(User.email == "admin@foodstore.com")
        )
        admin = result.scalars().first()

        # Verify admin user exists
        assert admin is not None
        assert admin.email == "admin@foodstore.com"
        assert admin.is_active is True
        assert admin.first_name == "Admin"
        assert admin.last_name == "FoodStore"

    async def test_seed_admin_user_has_phone(
        self, db_session: AsyncSession
    ) -> None:
        """Test admin user has phone number set."""
        await seed_roles(db_session)
        await db_session.commit()

        await seed_admin_user(db_session)
        await db_session.commit()

        result = await db_session.execute(
            select(User).where(User.email == "admin@foodstore.com")
        )
        admin = result.scalars().first()

        assert admin is not None
        assert admin.phone == "+5491112345678"

    async def test_seed_idempotent_running_twice_no_error(
        self, db_session: AsyncSession
    ) -> None:
        """Test seeds are idempotent — running twice doesn't raise errors."""
        # Run seeds once
        await run_seeds(db_session)
        await db_session.commit()

        # Run seeds again — should not error due to ON CONFLICT DO NOTHING
        await run_seeds(db_session)
        await db_session.commit()

        # Verify we still have exactly 6 estados (not 12)
        result = await db_session.execute(select(EstadoPedido))
        estados = result.scalars().all()
        assert len(estados) == 6

    async def test_run_seeds_complete_flow(
        self, db_session: AsyncSession
    ) -> None:
        """Test run_seeds executes all seed functions correctly."""
        # Run all seeds
        await run_seeds(db_session)
        await db_session.commit()

        # Verify all seeded data
        estados = (await db_session.execute(select(EstadoPedido))).scalars().all()
        formas = (await db_session.execute(select(FormaPago))).scalars().all()
        roles = (await db_session.execute(select(Role))).scalars().all()
        admin = (
            await db_session.execute(
                select(User).where(User.email == "admin@foodstore.com")
            )
        ).scalars().first()

        # Verify counts
        assert len(estados) == 6
        assert len(formas) == 3
        assert len(roles) == 4
        assert admin is not None
