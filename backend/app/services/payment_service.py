"""Payment service for handling MercadoPago IPN and payment flows."""

import logging
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
    mp_status: str,
    uow: UnitOfWork,
) -> None:
    """Handle MercadoPago IPN notification for a given order.

    Triggers FSM transitions based on the payment status received
    from the MercadoPago webhook.

    Args:
        order: Order being paid
        mp_status: MercadoPago payment status (approved, rejected, etc.)
        db: Database session
    """
    if mp_status == "approved":
        await transition(
            order,
            "CONFIRMADO",
            usuario_id=None,
            session=uow.session,
            motivo="Pago confirmado vía MercadoPago IPN",
        )
        logger.info("Order %d: payment approved via MP IPN", order.id)
    elif mp_status == "rejected":
        await transition(
            order,
            "CANCELADO",
            usuario_id=None,
            session=uow.session,
            motivo="Pago rechazado vía MercadoPago IPN",
        )
        logger.info("Order %d: payment rejected via MP IPN", order.id)
    else:
        logger.warning(
            "Order %d: unhandled MP IPN status '%s'", order.id, mp_status
        )
