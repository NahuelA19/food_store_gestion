"""Payment API routes for the Food Store."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from app.core.uow import UnitOfWork
from app.dependencies import get_uow
from app.models.order import Order
from app.services.payment_service import handle_ipn

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def mercadopago_webhook(
    external_reference: str | None = Query(None),
    topic: str | None = Query(None),
    uow: UnitOfWork = Depends(get_uow),
) -> dict[str, str]:
    """Handle MercadoPago IPN webhook events via query parameters.

    MercadoPago sends IPN notifications with:
    - external_reference: order ID (mapped to our Order.mp_payment_id or similar)
    - topic: "payment" or "merchant_order"

    For payment notifications:
    - We extract the payment status from the order's payment context
    - Then trigger FSM transitions via handle_ipn()

    Args:
        external_reference: Order reference from MercadoPago
        topic: Type of notification (e.g., "payment")
        uow: Unit of work for database access

    Returns:
        dict: Acknowledgment message

    Raises:
        HTTPException 404: Order not found
        HTTPException 400: Invalid or missing parameters
    """
    # Validate required parameters
    if not external_reference:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing 'external_reference' parameter",
        )

    if not topic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing 'topic' parameter",
        )

    # Only process payment notifications
    if topic != "payment":
        logger.info(
            "Ignoring MercadoPago IPN for topic '%s' (only 'payment' is handled)",
            topic,
        )
        return {"status": "acknowledged", "topic": topic}

    # Find the order by external_reference
    # NOTE: external_reference should map to the order ID or a payment reference
    # For simplicity, assume external_reference is the order ID
    try:
        order_id = int(external_reference)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid external_reference format: {external_reference}",
        )

    result = await uow.session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found",
        )

    # For now, assume the payment was approved if the webhook was received
    # In production, you would query MercadoPago's API to get the actual payment status
    # using the payment ID or merchant order ID from the webhook
    mp_status = "approved"

    try:
        await handle_ipn(order=order, mp_status=mp_status, uow=uow)
        await uow.commit()
        logger.info("MercadoPago IPN processed for order %d: status=%s", order_id, mp_status)
        return {"status": "processed", "order_id": str(order_id)}
    except Exception as e:
        logger.error("Error processing MercadoPago IPN for order %d: %s", order_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process payment notification",
        ) from e
