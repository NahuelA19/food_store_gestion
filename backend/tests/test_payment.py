"""Tests for payment webhook and service."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient


class TestPaymentWebhook:
    """Test Stripe webhook endpoint."""

    async def test_webhook_missing_signature(
        self,
        async_client: AsyncClient,
    ):
        """Webhook without signature returns 400."""
        response = await async_client.post(
            "/api/payments/webhook",
            content='{"type": "test"}',
        )
        assert response.status_code == 400
        assert "signature" in response.json()["detail"].lower()

    async def test_webhook_returns_200(
        self,
        async_client: AsyncClient,
    ):
        """Webhook with valid signature returns 200."""
        response = await async_client.post(
            "/api/payments/webhook",
            content='{"type": "test event"}',
            headers={"stripe-signature": "t=123,v1=test"},
        )
        assert response.status_code == 200


class TestPaymentService:
    """Test payment service functions with mocked Stripe."""

    @patch("app.services.payment_service.stripe.PaymentIntent.create")
    @patch("app.services.payment_service.stripe.Customer.create")
    async def test_create_payment_intent(
        self,
        mock_customer_create,
        mock_intent_create,
    ):
        """PaymentIntent creation returns client_secret."""
        from app.models.order import Order, OrderStatus
        from app.models.user import User
        from app.services.payment_service import create_payment_intent

        mock_customer_create.return_value = MagicMock(id="cus_test123")

        mock_intent = MagicMock()
        mock_intent.id = "pi_test123"
        mock_intent.client_secret = "pi_test123_secret_abc"
        mock_intent_create.return_value = mock_intent

        user = User(id=1, email="test@example.com")
        order = Order(
            id=1,
            user_id=1,
            status=OrderStatus.PAYMENT_PENDING,
            total_amount=66.00,
        )

        mock_db = AsyncMock()
        mock_db.flush = AsyncMock()

        result = await create_payment_intent(order, user, mock_db)

        assert result["client_secret"] == "pi_test123_secret_abc"
        assert result["payment_intent_id"] == "pi_test123"
        assert order.stripe_payment_intent_id == "pi_test123"
        mock_customer_create.assert_called_once_with(
            email=user.email, metadata={"user_id": str(user.id)}
        )

    @patch("app.services.payment_service.stripe.Webhook.construct_event")
    async def test_webhook_valid_event(self, mock_construct):
        """Valid webhook event is parsed correctly."""
        from app.services.payment_service import handle_webhook_event

        mock_construct.return_value = {
            "type": "payment_intent.succeeded",
            "id": "evt_test123",
            "data": {"object": {"id": "pi_test123"}},
        }

        result = await handle_webhook_event(b"{}", "t=123,v1=test")

        assert result["type"] == "payment_intent.succeeded"
        assert result["id"] == "evt_test123"

    @patch("app.services.payment_service.stripe.Webhook.construct_event")
    async def test_webhook_invalid_signature(self, mock_construct):
        """Invalid webhook signature raises 400."""
        import stripe

        from app.services.payment_service import handle_webhook_event

        mock_construct.side_effect = stripe.error.SignatureVerificationError(
            "Invalid signature", "test"
        )

        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc:
            await handle_webhook_event(b"{}", "t=123,v1=bad")
        assert exc.value.status_code == 400

    @patch("app.services.payment_service.stripe.Webhook.construct_event")
    async def test_webhook_unhandled_event_type(self, mock_construct):
        """Unhandled webhook event types are accepted but not processed."""
        from app.services.payment_service import handle_webhook_event

        mock_construct.return_value = {
            "type": "charge.succeeded",
            "id": "evt_other",
            "data": {"object": {"id": "ch_123"}},
        }

        result = await handle_webhook_event(b"{}", "t=123,v1=test")
        assert result["type"] == "charge.succeeded"

    @patch("app.services.payment_service.stripe.Webhook.construct_event")
    async def test_webhook_payload_error(self, mock_construct):
        """Invalid payload raises 400."""
        from app.services.payment_service import handle_webhook_event

        mock_construct.side_effect = ValueError("Invalid payload")

        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc:
            await handle_webhook_event(b"bad", "t=123,v1=test")
        assert exc.value.status_code == 400
