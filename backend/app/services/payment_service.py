"""Payment service for handling MercadoPago IPN and payment flows."""

import hashlib
import hmac
import logging
import time
from decimal import Decimal
from uuid import uuid4

import mercadopago
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.config import Settings
from app.core.uow import UnitOfWork
from app.models.order import Order
from app.models.pago import Pago
from app.services.order_service import transition

logger = logging.getLogger(__name__)


def verify_webhook_signature(
    data: str,
    signature: str,
    secret: str,
    timestamp: str,
) -> bool:
    """Verify MercadoPago webhook signature using HMAC-SHA256.

    Args:
        data: Raw request data/string to verify
        signature: X-Signature header value
        secret: mp_webhook_secret from settings
        timestamp: X-Timestamp header value

    Returns:
        bool: True if signature is valid, False otherwise
    """
    if not signature or not secret:
        logger.warning("Webhook signature verification skipped: missing signature or secret")
        return False

    # Build the message to sign: timestamp + "|" + data
    message = f"{timestamp}|{data}"

    # Compute HMAC-SHA256
    expected_signature = hmac.new(
        secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    # Use constant-time comparison to prevent timing attacks
    is_valid = hmac.compare_digest(expected_signature, signature)

    if not is_valid:
        logger.warning("Webhook signature verification failed: invalid signature")

    return is_valid


async def get_payment_status_from_mp(
    payment_id: int,
    settings: Settings,
) -> dict | None:
    """Query MercadoPago API to get the actual payment status.

    Args:
        payment_id: MercadoPago payment ID
        settings: App settings with MP credentials

    Returns:
        dict: Payment status data from MP, or None on error
    """
    if not settings.mp_access_token:
        logger.error("Cannot query MP: access token not configured")
        return None

    sdk = mercadopago.SDK(settings.mp_access_token)

    try:
        response = sdk.payment().get(payment_id)
        if response["status"] >= 400:
            logger.error("MercadoPago API error getting payment %d: %s", payment_id, response)
            return None

        payment_data = response.get("response", {})
        logger.info("Retrieved payment status from MP: payment_id=%d, status=%s",
                    payment_id, payment_data.get("status"))
        return payment_data
    except Exception as e:
        logger.error("Error querying MercadoPago API for payment %d: %s", payment_id, e)
        return None


def map_mp_status_to_fsm(mp_status: str) -> str | None:
    """Map MercadoPago payment status to order FSM state.

    Args:
        mp_status: MercadoPago payment status (approved, rejected, pending, etc.)

    Returns:
        str: FSM state to transition to, or None if not handled
    """
    status_mapping = {
        "approved": "CONFIRMADO",
        "rejected": "CANCELADO",
        "pending": "PENDIENTE",
        "in_process": "PENDIENTE",
        "in_mediation": "PENDIENTE",
        "cancelled": "CANCELADO",
        "refunded": "CANCELADO",
    }
    return status_mapping.get(mp_status.lower())


async def create_preference(
    order: Order,
    settings: Settings,
    uow: UnitOfWork,
) -> tuple[str, str]:
    """Create a MercadoPago preference for an order.

    Creates a preference in MP, stores the payment record in the database,
    and returns the preference_id and init_point (checkout URL).

    Args:
        order: Order to create payment preference for
        settings: App settings with MP credentials
        uow: Unit of work for database access

    Returns:
        tuple: (preference_id, init_point) for redirecting to MP checkout

    Raises:
        ValueError: If MP credentials are missing or API fails
    """
    if not settings.mp_access_token:
        raise ValueError("MercadoPago access token not configured")

    # Initialize SDK
    sdk = mercadopago.SDK(settings.mp_access_token)

    # Generate idempotency key to prevent duplicate charges
    idempotency_key = uuid4()

    # Use order total amount
    total_amount = order.total_amount

    # Generate external reference UUID for IPN webhook matching
    external_ref_uuid = uuid4()

    # Build preference payload
    preference_data = {
        "items": [
            {
                "id": str(order.id),
                "title": f"Orden #{order.id}",
                "description": f"Compra de {len(order.items)} producto(s)",
                "quantity": 1,
                "currency_id": "ARS",
                "unit_price": float(total_amount),
            }
        ],
        "payer": {
            "email": order.user.email if order.user else "unknown@example.com",
        },
        "back_urls": {
            "success": f"{settings.base_url}/orders/{order.id}?status=success",
            "failure": f"{settings.base_url}/orders/{order.id}?status=failure",
            "pending": f"{settings.base_url}/orders/{order.id}?status=pending",
        },
        "auto_return": "approved",
        "external_reference": str(order.id),  # Maps IPN webhook to order (MP uses this in notification)
        "statement_descriptor": "FoodStore",
    }

    # Create preference via SDK
    response = sdk.preference().create(preference_data)

    if response["status"] >= 400:
        logger.error("MercadoPago preference creation failed: %s", response)
        raise ValueError(f"MercadoPago API error: {response.get('response', {})}")

    preference_response = response.get("response", {})
    preference_id = preference_response.get("id")
    init_point = preference_response.get("init_point")

    if not preference_id or not init_point:
        logger.error("Missing preference_id or init_point in MP response: %s", preference_response)
        raise ValueError("MercadoPago returned incomplete preference data")

    # Store payment record in database
    pago = Pago(
        pedido_id=order.id,
        idempotency_key=idempotency_key,
        external_reference=external_ref_uuid,  # Internal UUID for tracking
        mp_payment_id=preference_id,
        monto=total_amount,
        mp_raw_response=preference_response,
    )

    uow.session.add(pago)

    # Attempt to save — catch integrity errors for duplicates
    try:
        await uow.flush()
    except IntegrityError:
        # Likely duplicate idempotency key (race condition or retry)
        logger.warning("Duplicate payment record for order %d (idempotency key conflict)", order.id)
        await uow.session.rollback()
        # Re-query the existing pago record
        result = await uow.session.execute(
            select(Pago).where(Pago.pedido_id == order.id).order_by(Pago.created_at.desc())
        )
        existing_pago = result.scalar_one_or_none()
        if existing_pago:
            init_point = existing_pago.mp_raw_response.get("init_point", init_point) if existing_pago.mp_raw_response else init_point
            logger.info("Returning existing preference for order %d: %s", order.id, existing_pago.mp_payment_id)
            return existing_pago.mp_payment_id, init_point

    logger.info("Created MercadoPago preference for order %d: preference_id=%s", order.id, preference_id)
    return preference_id, init_point


async def handle_ipn(
    order: Order,
    mp_payment_id: int | None,
    settings: Settings,
    uow: UnitOfWork,
) -> bool:
    """Handle MercadoPago IPN notification for a given order.

    Queries MP API for actual payment status and triggers FSM
    transitions accordingly. Implements idempotency to prevent
    duplicate processing.

    Args:
        order: Order being paid
        mp_payment_id: MercadoPago payment ID (from webhook)
        settings: App settings
        uow: Unit of work for database access

    Returns:
        bool: True if processed successfully, False on error or duplicate
    """
    # Check idempotency: only process if payment status changed
    # Query existing payment record
    result = await uow.session.execute(
        select(Pago).where(Pago.pedido_id == order.id).order_by(Pago.created_at.desc())
    )
    existing_pago = result.scalar_one_or_none()

    if existing_pago and existing_pago.mp_status == "approved":
        logger.info("Order %d: payment already approved, skipping duplicate IPN", order.id)
        return True

    # If no payment_id provided, we cannot query MP
    if not mp_payment_id:
        logger.warning("Order %d: no payment_id in IPN, cannot process", order.id)
        return False

    # Query MP API for actual payment status
    payment_data = await get_payment_status_from_mp(mp_payment_id, settings)
    if not payment_data:
        logger.error("Order %d: failed to get payment status from MP", order.id)
        return False

    mp_status = payment_data.get("status", "").lower()
    status_detail = payment_data.get("status_detail", "")

    logger.info("Order %d: MP payment status=%s, detail=%s", order.id, mp_status, status_detail)

    # Map MP status to FSM state
    fsm_state = map_mp_status_to_fsm(mp_status)
    if not fsm_state:
        logger.warning("Order %d: unhandled MP status '%s'", order.id, mp_status)
        return False

    # Get motivo based on status
    motivos = {
        "CONFIRMADO": "Pago confirmado vía MercadoPago",
        "CANCELADO": f"Pago rechazado: {status_detail}",
        "PENDIENTE": "Pago en proceso",
    }
    motivo = motivos.get(fsm_state, f"Pago MP estado: {mp_status}")

    # Trigger FSM transition
    await transition(
        order,
        fsm_state,
        usuario_id=None,
        session=uow.session,
        motivo=motivo,
    )

    # Update payment record status
    if existing_pago:
        existing_pago.mp_status = "approved" if mp_status == "approved" else mp_status
        existing_pago.mp_status_detail = status_detail
        existing_pago.mp_raw_response = payment_data

    logger.info("Order %d: IPN processed - MP status=%s, FSM state=%s", order.id, mp_status, fsm_state)
    return True
