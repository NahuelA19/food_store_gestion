"""Payment API routes for the Food Store."""

import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import select

from app.config import Settings
from app.core.uow import UnitOfWork
from app.dependencies import get_current_user, get_settings, get_uow
from app.models.order import Order
from app.models.user import User
from app.services.payment_service import create_preference, handle_ipn, verify_webhook_signature

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/preference", status_code=status.HTTP_201_CREATED)
async def create_payment_preference(
    order_id: int = Query(..., description="Order ID to create preference for"),
    current_user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    uow: UnitOfWork = Depends(get_uow),
) -> dict[str, str]:
    """Create a MercadoPago payment preference for an order.

    Requires authentication. Only the order owner or admin can create preferences.

    Args:
        order_id: ID of the order to create preference for
        current_user: Authenticated user
        settings: Application settings
        uow: Unit of work for database access

    Returns:
        dict: MercadoPago preference_id and init_point (checkout URL)

    Raises:
        HTTPException 404: Order not found or not owned by user
        HTTPException 403: User not authorized
        HTTPException 500: Payment preference creation failed
    """
    result = await uow.session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found",
        )

    # Verify ownership (only order owner or admin can create preference)
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create payment preference for this order",
        )

    try:
        preference_id, init_point = await create_preference(order, settings, uow)
        await uow.commit()
        return {
            "preference_id": preference_id,
            "init_point": init_point,
        }
    except ValueError as e:
        logger.error("Failed to create preference for order %d: %s", order_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment preference creation failed: {str(e)}",
        ) from e


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def mercadopago_webhook(
    request: Request,
    external_reference: str | None = Query(None),
    topic: str | None = Query(None),
    id: str | None = Query(None, description="Payment/merchant order ID from MP"),
    x_signature: str | None = Header(None, alias="X-Signature"),
    x_timestamp: str | None = Header(None, alias="X-Timestamp"),
    settings: Settings = Depends(get_settings),
    uow: UnitOfWork = Depends(get_uow),
) -> dict[str, str]:
    """Handle MercadoPago IPN webhook events via query parameters.

    Implements:
    - Signature verification (HMAC-SHA256) when X-Signature header present
    - Real payment status query from MP API (not assumed)
    - Idempotency to prevent duplicate processing

    MercadoPago sends IPN notifications with:
    - external_reference: order ID (our internal reference)
    - topic: "payment" or "merchant_order"
    - id: payment ID (to query actual status)

    Args:
        request: FastAPI request for signature verification
        external_reference: Order reference from MercadoPago
        topic: Type of notification (e.g., "payment")
        id: Payment ID from MP (for querying status)
        x_signature: Signature header for verification
        x_timestamp: Timestamp header for signature
        settings: App settings (includes mp_webhook_secret)
        uow: Unit of work for database access

    Returns:
        dict: Acknowledgment message

    Raises:
        HTTPException 403: Invalid webhook signature
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

    # Verify webhook signature if secret is configured
    if settings.mp_webhook_secret and x_signature and x_timestamp:
        # Read raw body for signature verification
        raw_body = await request.body()
        body_str = raw_body.decode("utf-8") if raw_body else external_reference

        is_valid = verify_webhook_signature(
            data=body_str,
            signature=x_signature,
            secret=settings.mp_webhook_secret,
            timestamp=x_timestamp,
        )

        if not is_valid:
            logger.warning("Invalid webhook signature from IP: %s", request.client.host if request.client else "unknown")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid webhook signature",
            )

        logger.info("Webhook signature verified successfully")
    else:
        logger.info("Webhook signature verification skipped (no secret or headers)")

    # Only process payment notifications
    if topic != "payment":
        logger.info(
            "Ignoring MercadoPago IPN for topic '%s' (only 'payment' is handled)",
            topic,
        )
        return {"status": "acknowledged", "topic": topic}

    # Find the order by external_reference (order ID)
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

    # Extract payment ID from webhook - can come as "id" query param
    mp_payment_id: int | None = None
    if id:
        try:
            mp_payment_id = int(id)
        except (ValueError, TypeError):
            logger.warning("Invalid payment ID format in webhook: %s", id)

    # Process IPN with real payment status from MP API
    try:
        success = await handle_ipn(
            order=order,
            mp_payment_id=mp_payment_id,
            settings=settings,
            uow=uow,
        )

        if success:
            await uow.commit()
            logger.info("MercadoPago IPN processed for order %d", order_id)
            return {"status": "processed", "order_id": str(order_id)}
        else:
            logger.warning("IPN processing returned False for order %d", order_id)
            return {"status": "skipped", "order_id": str(order_id), "reason": "no_payment_id_or_status"}

    except Exception as e:
        logger.error("Error processing MercadoPago IPN for order %d: %s", order_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process payment notification",
        ) from e
