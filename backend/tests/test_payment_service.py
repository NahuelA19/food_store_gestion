"""Tests for payment service functions (MercadoPago IPN handling)."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch, AsyncMock, MagicMock

from app.core.uow import UnitOfWork
from app.models.estado_pedido import EstadoPedido
from app.models.historial_estado_pedido import HistorialEstadoPedido
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.security.password import get_password_hash
from app.services.payment_service import handle_ipn


@pytest.fixture
async def seed_estados(db_session: AsyncSession) -> None:
    """Seed estados_pedido table with the 6 FSM states."""
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
async def payment_test_user(db_session: AsyncSession) -> User:
    """Create a test user for payment tests."""
    user = User(
        email="paymenttest@example.com",
        hashed_password=get_password_hash("PaymentTestPassword123"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def pending_order(db_session: AsyncSession, seed_estados: None, payment_test_user: User) -> Order:
    """Create a pending order for payment tests."""
    order = Order(
        user_id=payment_test_user.id,
        status=OrderStatus.PENDIENTE,
        estado_codigo="PENDIENTE",
        total_amount=100.00,
    )
    db_session.add(order)
    await db_session.flush()
    await db_session.refresh(order)
    return order


@pytest.mark.asyncio
class TestPaymentService:
    """Test payment service IPN handling."""

    async def test_handle_ipn_approved_transitions_to_confirmado(
        self, db_session: AsyncSession, pending_order: Order, seed_estados: None
    ) -> None:
        """Test IPN handler transitions order to CONFIRMADO when mp_status='approved'."""
        async with UnitOfWork(db_session) as uow:
            # Call handle_ipn with approved status
            await handle_ipn(
                order=pending_order,
                mp_status="approved",
                uow=uow,
            )
            await uow.commit()

        # Refresh to load from DB
        await db_session.refresh(pending_order)

        # Verify state transition
        assert pending_order.estado_codigo == "CONFIRMADO"
        assert pending_order.status == OrderStatus.CONFIRMADO

        # Verify historial was created
        assert len(pending_order.historial) == 1
        assert pending_order.historial[0].estado_desde == "PENDIENTE"
        assert pending_order.historial[0].estado_hasta == "CONFIRMADO"
        assert "Pago confirmado vía MercadoPago IPN" in pending_order.historial[0].motivo

    async def test_handle_ipn_rejected_transitions_to_cancelado(
        self, db_session: AsyncSession, pending_order: Order, seed_estados: None
    ) -> None:
        """Test IPN handler transitions order to CANCELADO when mp_status='rejected'."""
        async with UnitOfWork(db_session) as uow:
            await handle_ipn(
                order=pending_order,
                mp_status="rejected",
                uow=uow,
            )
            await uow.commit()

        await db_session.refresh(pending_order)

        # Verify state transition
        assert pending_order.estado_codigo == "CANCELADO"
        assert pending_order.status == OrderStatus.CANCELADO

        # Verify historial was created
        assert len(pending_order.historial) == 1
        assert pending_order.historial[0].estado_desde == "PENDIENTE"
        assert pending_order.historial[0].estado_hasta == "CANCELADO"
        assert "Pago rechazado vía MercadoPago IPN" in pending_order.historial[0].motivo

    async def test_handle_ipn_with_pending_order_transitions_correctly(
        self, db_session: AsyncSession, pending_order: Order, seed_estados: None
    ) -> None:
        """Test IPN handler creates historial records correctly."""
        async with UnitOfWork(db_session) as uow:
            # Approve payment via IPN
            await handle_ipn(
                order=pending_order,
                mp_status="approved",
                uow=uow,
            )
            await uow.commit()

        await db_session.refresh(pending_order)

        # Verify historial record has correct structure
        historial_record = pending_order.historial[0]
        assert historial_record.pedido_id == pending_order.id
        assert historial_record.estado_desde == "PENDIENTE"
        assert historial_record.estado_hasta == "CONFIRMADO"
        assert historial_record.usuario_id is None  # IPN doesn't have a user
        assert historial_record.motivo is not None

    async def test_handle_ipn_unknown_status_logs_warning(
        self, db_session: AsyncSession, pending_order: Order, seed_estados: None
    ) -> None:
        """Test IPN handler logs warning for unknown status (no state transition)."""
        async with UnitOfWork(db_session) as uow:
            # Pass unknown status
            await handle_ipn(
                order=pending_order,
                mp_status="pending",
                uow=uow,
            )
            await uow.commit()

        await db_session.refresh(pending_order)

        # Order should remain in PENDIENTE state (no transition)
        assert pending_order.estado_codigo == "PENDIENTE"
        assert len(pending_order.historial) == 0
