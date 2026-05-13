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

from app.config import Settings
from app.security.jwt import create_access_token
from app.services.payment_service import process_card_payment


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


# ============================================================
# process_card_payment service tests
# ============================================================


@pytest.mark.asyncio
class TestProcessCardPayment:
    """Tests for process_card_payment service function."""

    async def test_missing_access_token_raises_error(
        self, db_session: AsyncSession, pending_order: Order
    ) -> None:
        """Missing mp_access_token should raise ValueError."""
        settings = Settings(mp_access_token="")

        async with UnitOfWork(db_session) as uow:
            with pytest.raises(ValueError, match="MercadoPago access token not configured"):
                await process_card_payment(
                    order=pending_order,
                    token="test-token",
                    payment_method_id="visa",
                    installments=1,
                    payer_email="buyer@example.com",
                    settings=settings,
                    uow=uow,
                )

    async def test_successful_payment_transitions_to_confirmado(
        self, db_session: AsyncSession, pending_order: Order, seed_estados: None
    ) -> None:
        """Approved MP response transitions order to CONFIRMADO and stores Pago."""
        settings = Settings(mp_access_token="test-token")

        with patch("app.services.payment_service.mercadopago.SDK") as mock_sdk_cls:
            mock_instance = MagicMock()
            mock_sdk_cls.return_value = mock_instance
            mock_instance.payment.return_value.create.return_value = {
                "status": 201,
                "response": {
                    "id": "123",
                    "status": "approved",
                    "status_detail": "accredited",
                },
            }

            async with UnitOfWork(db_session) as uow:
                result = await process_card_payment(
                    order=pending_order,
                    token="card-token-abc",
                    payment_method_id="visa",
                    installments=1,
                    payer_email="buyer@example.com",
                    settings=settings,
                    uow=uow,
                )
                await uow.commit()

        await db_session.refresh(pending_order)

        assert pending_order.estado_codigo == "CONFIRMADO"
        assert pending_order.status == OrderStatus.CONFIRMADO

        assert len(pending_order.historial) == 1
        assert pending_order.historial[0].estado_hasta == "CONFIRMADO"

        assert len(pending_order.pagos) == 1
        pago = pending_order.pagos[0]
        assert pago.mp_payment_id == "123"
        assert pago.mp_status == "approved"
        assert pago.mp_status_detail == "accredited"
        assert pago.monto == pending_order.total_amount
        assert pago.pedido_id == pending_order.id

        assert result["id"] == "123"
        assert result["status"] == "approved"
        assert result["status_detail"] == "accredited"

    async def test_rejected_payment_transitions_to_cancelado(
        self, db_session: AsyncSession, pending_order: Order, seed_estados: None
    ) -> None:
        """Rejected MP response transitions order to CANCELADO and stores Pago."""
        settings = Settings(mp_access_token="test-token")

        with patch("app.services.payment_service.mercadopago.SDK") as mock_sdk_cls:
            mock_instance = MagicMock()
            mock_sdk_cls.return_value = mock_instance
            mock_instance.payment.return_value.create.return_value = {
                "status": 201,
                "response": {
                    "id": "456",
                    "status": "rejected",
                    "status_detail": "cc_rejected_other_reason",
                },
            }

            async with UnitOfWork(db_session) as uow:
                result = await process_card_payment(
                    order=pending_order,
                    token="bad-card-token",
                    payment_method_id="master",
                    installments=3,
                    payer_email="buyer@example.com",
                    settings=settings,
                    uow=uow,
                )
                await uow.commit()

        await db_session.refresh(pending_order)

        assert pending_order.estado_codigo == "CANCELADO"
        assert pending_order.status == OrderStatus.CANCELADO

        assert len(pending_order.historial) == 1
        assert pending_order.historial[0].estado_hasta == "CANCELADO"
        assert "cc_rejected_other_reason" in pending_order.historial[0].motivo

        assert len(pending_order.pagos) == 1
        pago = pending_order.pagos[0]
        assert pago.mp_payment_id == "456"
        assert pago.mp_status == "rejected"
        assert pago.mp_status_detail == "cc_rejected_other_reason"
        assert pago.pedido_id == pending_order.id

        assert result["id"] == "456"
        assert result["status"] == "rejected"


# ============================================================
# POST /payments/process-card endpoint tests
# ============================================================


@pytest.mark.asyncio
class TestProcessCardPaymentEndpoint:
    """Tests for POST /api/v1/payments/process-card endpoint."""

    async def test_without_auth_returns_401(
        self, async_client,
    ) -> None:
        """Request without auth header should return 401."""
        response = await async_client.post(
            "/api/v1/payments/process-card?order_id=1",
            json={
                "token": "test-token",
                "payment_method_id": "visa",
                "installments": 1,
                "payer_email": "buyer@example.com",
            },
        )
        assert response.status_code == 401

    async def test_with_wrong_order_owner_returns_403(
        self, async_client, db_session, test_user, seed_estados
    ) -> None:
        """Order owned by another user should return 403."""
        other_user = User(
            email="otheruser@example.com",
            hashed_password=get_password_hash("OtherPass123"),
            is_active=True,
        )
        db_session.add(other_user)
        await db_session.flush()

        order = Order(
            user_id=other_user.id,
            status=OrderStatus.PENDIENTE,
            estado_codigo="PENDIENTE",
            total_amount=50.00,
        )
        db_session.add(order)
        await db_session.commit()
        await db_session.refresh(order)

        token = create_access_token(data={"user_id": test_user.id})
        headers = {"Authorization": f"Bearer {token}"}

        mock_process = AsyncMock(return_value={"id": "x", "status": "approved"})
        with patch("app.routes.payments.process_card_payment", mock_process):
            response = await async_client.post(
                "/api/v1/payments/process-card",
                params={"order_id": order.id},
                json={
                    "token": "test-token",
                    "payment_method_id": "visa",
                    "installments": 1,
                    "payer_email": "buyer@example.com",
                },
                headers=headers,
            )

        assert response.status_code == 403
        mock_process.assert_not_called()

    async def test_with_valid_auth_success(
        self, async_client, db_session, test_user, seed_estados
    ) -> None:
        """Valid auth and correct ownership processes payment successfully."""
        order = Order(
            user_id=test_user.id,
            status=OrderStatus.PENDIENTE,
            estado_codigo="PENDIENTE",
            total_amount=75.00,
        )
        db_session.add(order)
        await db_session.commit()
        await db_session.refresh(order)

        token = create_access_token(data={"user_id": test_user.id})
        headers = {"Authorization": f"Bearer {token}"}

        mock_response = {"id": "789", "status": "approved", "status_detail": "accredited"}
        mock_process = AsyncMock(return_value=mock_response)
        with patch("app.routes.payments.process_card_payment", mock_process):
            response = await async_client.post(
                "/api/v1/payments/process-card",
                params={"order_id": order.id},
                json={
                    "token": "card-token-xyz",
                    "payment_method_id": "visa",
                    "installments": 3,
                    "payer_email": "buyer@example.com",
                },
                headers=headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "789"
        assert data["status"] == "approved"
        assert data["status_detail"] == "accredited"
        mock_process.assert_awaited_once()
