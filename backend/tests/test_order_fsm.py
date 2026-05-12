"""Tests for FSM (Finite State Machine) transitions in the order service.

This file focuses specifically on validating that the 6-state FSM model
works correctly with proper state transitions and error handling.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.uow import UnitOfWork
from app.models.estado_pedido import EstadoPedido
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.security.password import get_password_hash
from app.services.order_service import FSM_TRANSITIONS, transition
from fastapi import HTTPException


@pytest.fixture
async def seed_estados(db_session: AsyncSession) -> None:
    """Seed estados_pedido table with the 6 FSM v6 states."""
    estados = [
        EstadoPedido(codigo="PENDIENTE", descripcion="Pedido creado", es_terminal=False),
        EstadoPedido(codigo="CONFIRMADO", descripcion="Pago confirmado", es_terminal=False),
        EstadoPedido(codigo="EN_PREP", descripcion="Preparando pedido", es_terminal=False),
        EstadoPedido(codigo="EN_CAMINO", descripcion="En camino a delivery", es_terminal=False),
        EstadoPedido(codigo="ENTREGADO", descripcion="Pedido entregado", es_terminal=True),
        EstadoPedido(codigo="CANCELADO", descripcion="Pedido cancelado", es_terminal=True),
    ]
    for e in estados:
        db_session.add(e)
    await db_session.commit()


@pytest.fixture
async def test_user_fsm(db_session: AsyncSession) -> User:
    """Create a test user for FSM tests."""
    user = User(
        email="fsmtest@example.com",
        hashed_password=get_password_hash("FSMTestPassword123"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def sample_order(db_session: AsyncSession, seed_estados: None, test_user_fsm: User) -> Order:
    """Create a sample order in PENDIENTE state."""
    # Create an order linked to a real user
    order = Order(
        user_id=test_user_fsm.id,
        status=OrderStatus.PENDIENTE,
        estado_codigo="PENDIENTE",
        total_amount=100.00,
    )
    db_session.add(order)
    await db_session.flush()
    await db_session.refresh(order)
    return order


@pytest.mark.asyncio
class TestFSMTransitions:
    """Test valid and invalid FSM state transitions."""

    async def test_fsm_valid_pendiente_to_confirmado(
        self, db_session: AsyncSession, sample_order: Order, seed_estados: None
    ) -> None:
        """Test valid transition: PENDIENTE → CONFIRMADO."""
        async with UnitOfWork(db_session) as uow:
            # Valid transition via payment webhook
            await transition(
                order=sample_order,
                nuevo_estado="CONFIRMADO",
                usuario_id=None,
                session=uow.session,
                motivo="Pago confirmado vía MercadoPago IPN",
            )
            await uow.commit()

        # Refresh to load historial from DB
        await db_session.refresh(sample_order)

        # Verify transition was recorded
        assert sample_order.estado_codigo == "CONFIRMADO"
        assert sample_order.status == OrderStatus.CONFIRMADO
        assert len(sample_order.historial) == 1
        assert sample_order.historial[0].estado_desde == "PENDIENTE"
        assert sample_order.historial[0].estado_hasta == "CONFIRMADO"

    async def test_fsm_valid_confirmado_to_en_prep(
        self, db_session: AsyncSession, sample_order: Order, seed_estados: None
    ) -> None:
        """Test valid transition: CONFIRMADO → EN_PREP."""
        async with UnitOfWork(db_session) as uow:
            # First transition to CONFIRMADO
            await transition(
                order=sample_order,
                nuevo_estado="CONFIRMADO",
                usuario_id=None,
                session=uow.session,
            )
            await uow.flush()

            # Then transition to EN_PREP
            await transition(
                order=sample_order,
                nuevo_estado="EN_PREP",
                usuario_id=1,
                session=uow.session,
                motivo="Admin iniciando preparación",
            )
            await uow.commit()

        # Refresh to load historial from DB
        await db_session.refresh(sample_order)

        assert sample_order.estado_codigo == "EN_PREP"
        assert sample_order.status == OrderStatus.EN_PREP
        assert len(sample_order.historial) == 2

    async def test_fsm_valid_en_prep_to_en_camino(
        self, db_session: AsyncSession, sample_order: Order, seed_estados: None
    ) -> None:
        """Test valid transition: EN_PREP → EN_CAMINO."""
        async with UnitOfWork(db_session) as uow:
            # Build up to EN_PREP
            await transition(sample_order, "CONFIRMADO", None, uow.session)
            await uow.flush()
            await transition(sample_order, "EN_PREP", 1, uow.session)
            await uow.flush()

            # Now transition to EN_CAMINO
            await transition(
                sample_order,
                "EN_CAMINO",
                1,
                uow.session,
                motivo="Pedido entregado a repartidor",
            )
            await uow.commit()

        assert sample_order.estado_codigo == "EN_CAMINO"
        assert sample_order.status == OrderStatus.EN_CAMINO

    async def test_fsm_valid_en_camino_to_entregado(
        self, db_session: AsyncSession, sample_order: Order, seed_estados: None
    ) -> None:
        """Test valid transition: EN_CAMINO → ENTREGADO (terminal)."""
        async with UnitOfWork(db_session) as uow:
            # Build up to EN_CAMINO
            await transition(sample_order, "CONFIRMADO", None, uow.session)
            await uow.flush()
            await transition(sample_order, "EN_PREP", 1, uow.session)
            await uow.flush()
            await transition(sample_order, "EN_CAMINO", 1, uow.session)
            await uow.flush()

            # Transition to ENTREGADO (terminal)
            await transition(
                sample_order,
                "ENTREGADO",
                1,
                uow.session,
                motivo="Cliente confirmó entrega",
            )
            await uow.commit()

        assert sample_order.estado_codigo == "ENTREGADO"
        assert sample_order.status == OrderStatus.ENTREGADO
        # ENTREGADO is terminal, so no further transitions allowed
        assert len(FSM_TRANSITIONS.get("ENTREGADO", [])) == 0

    async def test_fsm_valid_pendiente_to_cancelado(
        self, db_session: AsyncSession, sample_order: Order, seed_estados: None
    ) -> None:
        """Test valid transition: PENDIENTE → CANCELADO (early cancellation)."""
        async with UnitOfWork(db_session) as uow:
            await transition(
                sample_order,
                "CANCELADO",
                1,
                uow.session,
                motivo="Cliente canceló orden",
            )
            await uow.commit()

        assert sample_order.estado_codigo == "CANCELADO"
        assert sample_order.status == OrderStatus.CANCELADO

    async def test_fsm_valid_en_prep_to_cancelado(
        self, db_session: AsyncSession, sample_order: Order, seed_estados: None
    ) -> None:
        """Test valid transition: EN_PREP → CANCELADO (cancel during prep)."""
        async with UnitOfWork(db_session) as uow:
            # Build up to EN_PREP
            await transition(sample_order, "CONFIRMADO", None, uow.session)
            await uow.flush()
            await transition(sample_order, "EN_PREP", 1, uow.session)
            await uow.flush()

            # Cancel
            await transition(
                sample_order,
                "CANCELADO",
                1,
                uow.session,
                motivo="Admin canceló pedido",
            )
            await uow.commit()

        assert sample_order.estado_codigo == "CANCELADO"

    @pytest.mark.asyncio
    async def test_fsm_invalid_pendiente_to_en_prep(
        self, db_session: AsyncSession, sample_order: Order, seed_estados: None
    ) -> None:
        """Test invalid transition: PENDIENTE → EN_PREP (should fail)."""
        async with UnitOfWork(db_session) as uow:
            with pytest.raises(HTTPException) as exc_info:
                await transition(
                    sample_order,
                    "EN_PREP",
                    1,
                    uow.session,
                )
            assert exc_info.value.status_code == 422
            assert "Transición inválida" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_fsm_invalid_confirmado_to_entregado(
        self, db_session: AsyncSession, sample_order: Order, seed_estados: None
    ) -> None:
        """Test invalid transition: CONFIRMADO → ENTREGADO (should fail)."""
        async with UnitOfWork(db_session) as uow:
            # Move to CONFIRMADO first
            await transition(sample_order, "CONFIRMADO", None, uow.session)
            await uow.flush()

            # Try invalid transition
            with pytest.raises(HTTPException) as exc_info:
                await transition(
                    sample_order,
                    "ENTREGADO",
                    1,
                    uow.session,
                )
            assert exc_info.value.status_code == 422
            assert "CONFIRMADO" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_fsm_terminal_entregado_rejects_all(
        self, db_session: AsyncSession, sample_order: Order, seed_estados: None
    ) -> None:
        """Test that ENTREGADO state rejects any transition (terminal)."""
        async with UnitOfWork(db_session) as uow:
            # Reach ENTREGADO
            await transition(sample_order, "CONFIRMADO", None, uow.session)
            await uow.flush()
            await transition(sample_order, "EN_PREP", 1, uow.session)
            await uow.flush()
            await transition(sample_order, "EN_CAMINO", 1, uow.session)
            await uow.flush()
            await transition(sample_order, "ENTREGADO", 1, uow.session)
            await uow.flush()

            # Try to transition from ENTREGADO (should fail)
            with pytest.raises(HTTPException) as exc_info:
                await transition(
                    sample_order,
                    "CANCELADO",
                    1,
                    uow.session,
                )
            assert exc_info.value.status_code == 422
            assert "ninguna (estado terminal)" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_fsm_terminal_cancelado_rejects_all(
        self, db_session: AsyncSession, sample_order: Order, seed_estados: None
    ) -> None:
        """Test that CANCELADO state rejects any transition (terminal)."""
        async with UnitOfWork(db_session) as uow:
            # Go to CANCELADO
            await transition(sample_order, "CANCELADO", 1, uow.session)
            await uow.flush()

            # Try to transition from CANCELADO (should fail)
            with pytest.raises(HTTPException) as exc_info:
                await transition(
                    sample_order,
                    "CONFIRMADO",
                    1,
                    uow.session,
                )
            assert exc_info.value.status_code == 422

    async def test_fsm_historial_records_all_transitions(
        self, db_session: AsyncSession, sample_order: Order, seed_estados: None
    ) -> None:
        """Test that historial correctly records all transitions."""
        async with UnitOfWork(db_session) as uow:
            # Perform multiple transitions
            transitions = [
                ("CONFIRMADO", None, "Pago confirmado"),
                ("EN_PREP", 1, "Admin iniciando prep"),
                ("EN_CAMINO", 1, "Entregado a repartidor"),
                ("ENTREGADO", 1, "Cliente confirmó entrega"),
            ]

            for nuevo_estado, usuario_id, motivo in transitions:
                await transition(
                    sample_order,
                    nuevo_estado,
                    usuario_id,
                    uow.session,
                    motivo=motivo,
                )
                await uow.flush()

            await uow.commit()

        # Refresh to load historial from DB
        await db_session.refresh(sample_order)

        # Verify historial has 4 entries
        assert len(sample_order.historial) == 4
        assert sample_order.historial[0].estado_desde == "PENDIENTE"
        assert sample_order.historial[0].estado_hasta == "CONFIRMADO"
        assert sample_order.historial[1].estado_desde == "CONFIRMADO"
        assert sample_order.historial[1].estado_hasta == "EN_PREP"
        assert sample_order.historial[2].estado_desde == "EN_PREP"
        assert sample_order.historial[2].estado_hasta == "EN_CAMINO"
        assert sample_order.historial[3].estado_desde == "EN_CAMINO"
        assert sample_order.historial[3].estado_hasta == "ENTREGADO"


class TestFSMValidStructure:
    """Verify the FSM structure itself is correct."""

    def test_fsm_has_six_states(self) -> None:
        """Verify FSM_TRANSITIONS has exactly 6 states."""
        assert len(FSM_TRANSITIONS) == 6
        states = set(FSM_TRANSITIONS.keys())
        expected = {"PENDIENTE", "CONFIRMADO", "EN_PREP", "EN_CAMINO", "ENTREGADO", "CANCELADO"}
        assert states == expected

    def test_fsm_terminal_states_have_no_transitions(self) -> None:
        """Verify ENTREGADO and CANCELADO have no outgoing transitions."""
        assert FSM_TRANSITIONS["ENTREGADO"] == []
        assert FSM_TRANSITIONS["CANCELADO"] == []

    def test_fsm_transition_rules(self) -> None:
        """Verify the transition rules match spec."""
        # PENDIENTE can go to CONFIRMADO or CANCELADO
        assert set(FSM_TRANSITIONS["PENDIENTE"]) == {"CONFIRMADO", "CANCELADO"}

        # CONFIRMADO can go to EN_PREP or CANCELADO
        assert set(FSM_TRANSITIONS["CONFIRMADO"]) == {"EN_PREP", "CANCELADO"}

        # EN_PREP can go to EN_CAMINO or CANCELADO
        assert set(FSM_TRANSITIONS["EN_PREP"]) == {"EN_CAMINO", "CANCELADO"}

        # EN_CAMINO can only go to ENTREGADO
        assert FSM_TRANSITIONS["EN_CAMINO"] == ["ENTREGADO"]

    def test_order_status_has_six_primary_states(self) -> None:
        """Verify OrderStatus enum has the 6 primary states."""
        primary_states = {
            OrderStatus.PENDIENTE,
            OrderStatus.CONFIRMADO,
            OrderStatus.EN_PREP,
            OrderStatus.EN_CAMINO,
            OrderStatus.ENTREGADO,
            OrderStatus.CANCELADO,
        }
        assert all(state in OrderStatus for state in primary_states)
