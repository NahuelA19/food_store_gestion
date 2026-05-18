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


async def process_card_payment(
    order: Order,
    token: str,
    payment_method_id: str,
    installments: int,
    payer_email: str,
    settings: Settings,
    uow: UnitOfWork,
) -> dict:
    """Process a card payment via MercadoPago SDK.

    Creates a payment directly using a card token (for frontend
    card form integration), transitions the order FSM, and stores
    a Pago record.

    Args:
        order: Order being paid
        token: Card token from MercadoPago SDK (CardForm)
        payment_method_id: Payment method ID (e.g. "visa", "master")
        installments: Number of installments
        payer_email: Buyer's email
        settings: App settings with MP credentials
        uow: Unit of work for database access

    Returns:
        dict: Full MP payment response with status and details

    Raises:
        ValueError: If MP credentials missing or payment fails
    """
    if not settings.mp_access_token:
        raise ValueError("MercadoPago access token not configured")

    sdk = mercadopago.SDK(settings.mp_access_token)

    payment_data = {
        "transaction_amount": float(order.total_amount),
        "token": token,
        "description": f"Order #{order.id}",
        "installments": installments,
        "payment_method_id": payment_method_id,
        "notification_url": settings.mp_notification_url,
        "payer": {
            "email": payer_email,
        },
    }

    response = sdk.payment().create(payment_data)

    if response["status"] >= 400:
        logger.error("MercadoPago card payment failed: %s", response)
        raise ValueError(f"MercadoPago payment error: {response.get('response', {})}")

    payment_response = response.get("response", {})
    mp_status = payment_response.get("status", "")
    status_detail = payment_response.get("status_detail", "")
    mp_payment_id = str(payment_response.get("id", ""))

    # Map MP status to FSM state and transition the order
    fsm_state = map_mp_status_to_fsm(mp_status)
    if fsm_state:
        motivos = {
            "CONFIRMADO": "Pago con tarjeta confirmado",
            "CANCELADO": f"Pago con tarjeta rechazado: {status_detail}",
            "PENDIENTE": "Pago con tarjeta en proceso",
        }
        motivo = motivos.get(fsm_state, f"Pago con tarjeta MP estado: {mp_status}")
        await transition(
            order,
            fsm_state,
            usuario_id=None,
            session=uow.session,
            motivo=motivo,
        )

    # Store payment record
    pago = Pago(
        pedido_id=order.id,
        monto=order.total_amount,
        mp_payment_id=mp_payment_id,
        mp_status=mp_status,
        mp_status_detail=status_detail,
        mp_raw_response=payment_response,
    )

    uow.session.add(pago)
    await uow.flush()

    logger.info(
        "Card payment processed for order %d: MP payment_id=%s, status=%s",
        order.id, mp_payment_id, mp_status,
    )
    return payment_response


async def create_preference(
    order: Order,
    settings: Settings,
    uow: UnitOfWork,
) -> tuple[str, str]:
    """Create a MercadoPago preference for an order.

    Creates a preference in MP, stores the payment record in the database,
    and returns the preference_id and init_point (checkout URL).

    When MP credentials are not configured (development/testing), returns
    a simulated preference that redirects to the order page as success.

    Args:
        order: Order to create payment preference for
        settings: App settings with MP credentials
        uow: Unit of work for database access

    Returns:
        tuple: (preference_id, init_point) for redirecting to MP checkout

    Raises:
        ValueError: If MP API call fails (only when credentials are present)
    """
    total_amount = order.total_amount

    # ── Simulated mode (no MP credentials) ──────────────────────────
    if not settings.mp_access_token:
        logger.warning("MP access token not configured — using simulated payment for order %d", order.id)

        idempotency_key = uuid4()
        external_ref_uuid = uuid4()

        preference_id = f"SIM-{order.id}"
        init_point = f"{settings.frontend_url}/payment/success?order_id={order.id}&simulated=true"

        # Simulated MP response
        simulated_response = {
            "id": preference_id,
            "init_point": init_point,
            "sandbox_init_point": init_point,
            "status": "simulated",
        }

        # Store simulated payment record
        pago = Pago(
            pedido_id=order.id,
            idempotency_key=idempotency_key,
            external_reference=external_ref_uuid,
            mp_payment_id=preference_id,
            monto=total_amount,
            mp_raw_response=simulated_response,
        )
        uow.session.add(pago)
        try:
            await uow.flush()
        except IntegrityError:
            await uow.session.rollback()
            result = await uow.session.execute(
                select(Pago).where(Pago.pedido_id == order.id).order_by(Pago.created_at.desc())
            )
            existing_pago = result.scalar_one_or_none()
            if existing_pago:
                existing_init = existing_pago.mp_raw_response.get("init_point", init_point) if existing_pago.mp_raw_response else init_point
                return existing_pago.mp_payment_id, existing_init

        logger.info("Created simulated preference for order %d: %s", order.id, preference_id)
        return preference_id, init_point

    # ── Real mode (MP credentials present) ───────────────────────────
    sdk = mercadopago.SDK(settings.mp_access_token)

    idempotency_key = uuid4()
    external_ref_uuid = uuid4()

    # Get payer email safely (eager-load user if needed, fallback for tests)
    payer_email = getattr(order.user, "email", None) if order.user else None
    if not payer_email:
        # Try to query the user if not loaded
        try:
            from app.models.user import User
            result = await uow.session.execute(select(User).where(User.id == order.user_id))
            user = result.scalar_one_or_none()
            payer_email = user.email if user else "unknown@example.com"
        except Exception:
            payer_email = "unknown@example.com"

    preference_data = {
        "items": [
            {
                "id": str(order.id),
                "title": f"Orden #{order.id} — Food Store",
                "description": f"Compra de {len(order.items)} producto(s)",
                "quantity": 1,
                "currency_id": "ARS",
                "unit_price": float(total_amount),
            }
        ],
        "payer": {
            "email": payer_email,
        },
        "notification_url": settings.mp_notification_url,
        "external_reference": str(order.id),
        "statement_descriptor": "FoodStore",
        "expires": False,
    }

    # Use backend as callback when BASE_URL is public (e.g. ngrok).
    # The callback endpoint processes the payment then redirects to the frontend.
    # This lets auto_return work even when FRONTEND_URL is localhost.
    base_is_public = (
        "localhost" not in settings.base_url
        and "127.0.0.1" not in settings.base_url
    )
    if base_is_public:
        preference_data["back_urls"] = {
            "success": f"{settings.base_url}/api/v1/payments/callback?status=success",
            "failure": f"{settings.base_url}/api/v1/payments/callback?status=failure",
            "pending": f"{settings.base_url}/api/v1/payments/callback?status=pending",
        }
        preference_data["auto_return"] = "approved"
    else:
        preference_data["back_urls"] = {
            "success": f"{settings.frontend_url}/payment/success?order_id={order.id}",
            "failure": f"{settings.frontend_url}/payment/failure?order_id={order.id}",
            "pending": f"{settings.frontend_url}/payment/pending?order_id={order.id}",
        }

    response = sdk.preference().create(preference_data)

    if response["status"] >= 400:
        logger.error("MercadoPago preference creation failed: %s", response)
        raise ValueError(f"MercadoPago API error: {response.get('response', {})}")

    preference_response = response.get("response", {})
    preference_id = preference_response.get("id")
    # Use sandbox_init_point when running with test credentials
    is_test_token = settings.mp_access_token.startswith("TEST-")
    init_point = (
        preference_response.get("sandbox_init_point")
        if is_test_token
        else preference_response.get("init_point")
    ) or preference_response.get("init_point")

    if not preference_id or not init_point:
        logger.error("Missing preference_id or init_point in MP response: %s", preference_response)
        raise ValueError("MercadoPago returned incomplete preference data")

    pago = Pago(
        pedido_id=order.id,
        idempotency_key=idempotency_key,
        external_reference=external_ref_uuid,
        mp_payment_id=preference_id,
        monto=total_amount,
        mp_raw_response=preference_response,
    )

    uow.session.add(pago)

    try:
        await uow.flush()
    except IntegrityError:
        logger.warning("Duplicate payment record for order %d (idempotency key conflict)", order.id)
        await uow.session.rollback()
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
