"""Payment API routes for the Food Store."""

import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.config import Settings
from app.core.uow import UnitOfWork
from app.dependencies import get_current_user, get_settings, get_uow
from app.models.order import Order
from app.models.user import User
from app.models.pago import Pago
from app.services.order_service import transition
from app.services.payment_service import (
    create_preference,
    get_payment_status_from_mp,
    handle_ipn,
    process_card_payment,
    verify_webhook_signature,
)


class CardPaymentRequest(BaseModel):
    """Request schema for card payment processing."""

    token: str = Field(..., min_length=1)
    payment_method_id: str = Field(..., min_length=1)
    installments: int = Field(1, ge=1, le=12)
    payer_email: str = Field(..., min_length=1)

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
    result = await uow.session.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.user),
            selectinload(Order.items),
        )
    )
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
    except Exception as e:
        logger.error("Failed to create preference for order %d: %s", order_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment preference creation failed: {str(e)}",
        ) from e


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def mercadopago_webhook(
    request: Request,
    # Old IPN format
    external_reference: str | None = Query(None),
    topic: str | None = Query(None),
    id: str | None = Query(None),
    # New webhook format uses 'type' instead of 'topic'
    type: str | None = Query(None),
    x_signature: str | None = Header(None, alias="X-Signature"),
    x_timestamp: str | None = Header(None, alias="X-Timestamp"),
    settings: Settings = Depends(get_settings),
    uow: UnitOfWork = Depends(get_uow),
) -> dict[str, str]:
    """Handle MercadoPago webhook/IPN notifications.

    Supports both notification formats:
    - Old IPN: ?id=<id>&topic=payment&external_reference=<order_id>
    - New webhook: ?data.id=<id>&type=payment  (data.id uses dot notation)

    When external_reference is missing (new format), queries MP API to
    retrieve the order reference from the payment object.
    """
    # New webhook format sends payment ID as 'data.id' (dot notation).
    # FastAPI can't bind that to a param name, so we read it from raw query string.
    data_id = request.query_params.get("data.id") or id

    # Normalize topic across both formats
    notification_topic = topic or type  # "payment", "merchant_order", "payment_intent"

    # Verify signature only when secret is configured and headers are present
    if settings.mp_webhook_secret and x_signature and x_timestamp:
        raw_body = await request.body()
        body_str = raw_body.decode("utf-8") if raw_body else (external_reference or "")
        if not verify_webhook_signature(
            data=body_str,
            signature=x_signature,
            secret=settings.mp_webhook_secret,
            timestamp=x_timestamp,
        ):
            logger.warning("Invalid webhook signature from %s", request.client.host if request.client else "unknown")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid webhook signature")
        logger.info("Webhook signature verified")

    # Acknowledge non-payment topics immediately (merchant_order, etc.)
    if notification_topic and notification_topic != "payment":
        logger.info("Acknowledging non-payment webhook topic '%s'", notification_topic)
        return {"status": "acknowledged", "topic": notification_topic}

    # Need a payment ID to do anything useful
    if not data_id:
        logger.warning("Webhook received with no payment ID (params: %s)", dict(request.query_params))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing payment ID")

    try:
        mp_payment_id = int(data_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid payment ID: {data_id}")

    # Resolve order_id: prefer external_reference from query params,
    # otherwise query MP API to get it from the payment object.
    order_id_str = external_reference
    if not order_id_str:
        payment_data = await get_payment_status_from_mp(mp_payment_id, settings)
        if not payment_data:
            logger.error("Cannot reach MP API to resolve order for payment %d", mp_payment_id)
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Cannot reach MercadoPago API")
        order_id_str = payment_data.get("external_reference")

    if not order_id_str:
        logger.warning("No external_reference found for MP payment %d", mp_payment_id)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot determine order from payment")

    try:
        order_id = int(order_id_str)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid external_reference: {order_id_str}")

    result = await uow.session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")

    try:
        success = await handle_ipn(order=order, mp_payment_id=mp_payment_id, settings=settings, uow=uow)
        if success:
            await uow.commit()
            logger.info("Webhook processed: order=%d mp_payment=%d", order_id, mp_payment_id)
            return {"status": "processed", "order_id": str(order_id)}

        logger.info("Webhook skipped (no change): order=%d", order_id)
        return {"status": "skipped", "order_id": str(order_id)}
    except Exception as e:
        logger.error("Error processing webhook for order %d: %s", order_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process webhook") from e


@router.post("/process-card", status_code=status.HTTP_200_OK)
async def process_card_payment_endpoint(
    order_id: int = Query(..., description="Order ID to process card payment for"),
    body: CardPaymentRequest = ...,
    current_user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Process a card payment for an order via MercadoPago.

    Uses a card token from the frontend (obtained via MercadoPago CardForm)
    to charge the card directly. Transitions the order FSM based on the
    payment result.

    Requires authentication. Only the order owner can pay.

    Args:
        order_id: ID of the order to pay
        body: Card payment details (token, payment_method_id, installments, payer_email)
        current_user: Authenticated user
        settings: Application settings
        uow: Unit of work for database access

    Returns:
        dict: MercadoPago payment response with status and details

    Raises:
        HTTPException 404: Order not found
        HTTPException 403: Not authorized
        HTTPException 500: Payment processing failed
    """
    result = await uow.session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found",
        )

    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process payment for this order",
        )

    try:
        payment_response = await process_card_payment(
            order=order,
            token=body.token,
            payment_method_id=body.payment_method_id,
            installments=body.installments,
            payer_email=body.payer_email,
            settings=settings,
            uow=uow,
        )
        await uow.commit()
        return payment_response
    except ValueError as e:
        logger.error("Failed to process card payment for order %d: %s", order_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Card payment processing failed: {str(e)}",
        ) from e


@router.post("/simulate-payment", status_code=status.HTTP_200_OK)
async def simulate_payment(
    order_id: int = Query(..., description="Order ID to simulate payment for"),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Simulate a successful card payment for testing purposes.
    
    This endpoint marks an order as paid WITHOUT calling MercadoPago.
    Use this for testing the payment flow without actual card charges.
    
    Args:
        order_id: ID of the order to simulate payment for
        current_user: Authenticated user
        uow: Unit of work for database access
    
    Returns:
        dict: Simulated payment response with success status
    
    Raises:
        HTTPException 404: Order not found
        HTTPException 403: Not authorized
    """
    result = await uow.session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found",
        )
    
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process payment for this order",
        )
    
    try:
        # Transition order to CONFIRMADO (approved)
        await transition(
            order,
            "CONFIRMADO",
            usuario_id=current_user.id,
            session=uow.session,
            motivo="Pago simulado para pruebas",
        )

        # Mark payment as succeeded and record timestamp
        from datetime import datetime, timezone
        from app.models.order import PaymentStatus
        order.payment_status = PaymentStatus.APPROVED
        order.paid_at = datetime.now(timezone.utc)
        order.payment_method = "MERCADOPAGO"
        uow.session.add(order)
        
        # Create a simulated payment record
        pago = Pago(
            pedido_id=order.id,
            monto=order.total_amount,
            mp_payment_id=f"SIM-{order.id}",
            mp_status="approved",
            mp_status_detail="Simulated payment for testing",
            mp_raw_response={
                "id": f"SIM-{order.id}",
                "status": "approved",
                "status_detail": "Simulated payment for testing",
                "transaction_amount": float(order.total_amount),
                "description": f"Order #{order.id} (simulated)",
            },
        )
        
        uow.session.add(pago)
        await uow.commit()
        
        logger.info(
            "Simulated payment for order %d: status=approved",
            order.id,
        )

        return {
            "id": f"SIM-{order.id}",
            "status": "approved",
            "status_detail": "Simulated payment - Order confirmed",
            "transaction_amount": float(order.total_amount),
            "description": f"Order #{order.id} (simulated)",
        }
    except Exception as e:
        logger.error("Failed to simulate payment for order %d: %s", order_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment simulation failed: {str(e)}",
        ) from e


@router.get("/callback")
async def payment_callback(
    request: Request,
    payment_status: str = Query(..., alias="status"),
    collection_id: str | None = Query(None),
    external_reference: str | None = Query(None),
    settings: Settings = Depends(get_settings),
    uow: UnitOfWork = Depends(get_uow),
) -> HTMLResponse:
    """Handle MercadoPago back_url redirect after checkout.

    Returns an HTML page with JS redirect instead of a 302 so the browser
    navigates to the frontend even when ngrok's browser interstitial is active.
    """
    order_id = external_reference or request.query_params.get("order_id")

    if payment_status == "success" and collection_id and order_id:
        try:
            result = await uow.session.execute(select(Order).where(Order.id == int(order_id)))
            order = result.scalar_one_or_none()
            if order:
                await handle_ipn(
                    order=order,
                    mp_payment_id=int(collection_id),
                    settings=settings,
                    uow=uow,
                )
                await uow.commit()
        except Exception as e:
            logger.error("Callback: failed to process payment for order %s: %s", order_id, e)

    destination_map = {
        "success": f"{settings.frontend_url}/orders/{order_id}",
        "failure": f"{settings.frontend_url}/payment/failure?order_id={order_id}",
        "pending": f"{settings.frontend_url}/payment/pending?order_id={order_id}",
    }
    destination = destination_map.get(payment_status, f"{settings.frontend_url}/orders")

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url={destination}">
  <title>Redirigiendo…</title>
  <script>window.location.replace("{destination}");</script>
</head>
<body></body>
</html>"""
    return HTMLResponse(content=html)


@router.post("/finalize", status_code=status.HTTP_200_OK)
async def finalize_payment_from_return(
    order_id: int = Query(..., description="Our internal order ID"),
    collection_id: str = Query(..., description="MercadoPago payment ID from back_url redirect"),
    current_user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Process a payment after MercadoPago redirects back to the app.

    Called by the frontend success page with the collection_id that MP
    appends to the back_url. Queries MP directly for payment status and
    transitions the order FSM — bypasses the webhook for localhost dev.
    """
    result = await uow.session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    try:
        mp_payment_id = int(collection_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid collection_id: {collection_id}")

    try:
        success = await handle_ipn(order=order, mp_payment_id=mp_payment_id, settings=settings, uow=uow)
        if success:
            await uow.commit()

        return {
            "processed": success,
            "order_id": order.id,
            "order_status": order.status.value if order.status else None,
            "payment_status": order.payment_status.value if order.payment_status else None,
        }
    except Exception as e:
        logger.error("Failed to finalize payment for order %d: %s", order_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment finalization failed: {str(e)}",
        ) from e


@router.get("/status/{mp_payment_id}", status_code=status.HTTP_200_OK)
async def get_payment_status(
    mp_payment_id: str,
    current_user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> dict:
    """Query MercadoPago API for real-time payment status.

    Useful for the success page to verify payment completion
    and for polling until webhooks arrive.

    Args:
        mp_payment_id: MercadoPago payment ID to query
        current_user: Authenticated user
        settings: Application settings

    Returns:
        dict: Payment status with id, status, status_detail, amount

    Raises:
        HTTPException 400: Invalid payment ID format
        HTTPException 404: Payment not found in MP
        HTTPException 503: MP API unreachable
    """
    try:
        payment_id = int(mp_payment_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payment ID: {mp_payment_id}",
        )

    payment_data = await get_payment_status_from_mp(payment_id, settings)

    if not payment_data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to retrieve payment status from MercadoPago",
        )

    return {
        "id": payment_data.get("id"),
        "status": payment_data.get("status"),
        "status_detail": payment_data.get("status_detail"),
        "transaction_amount": payment_data.get("transaction_amount"),
        "currency_id": payment_data.get("currency_id"),
        "payment_method_id": payment_data.get("payment_method_id"),
        "date_approved": payment_data.get("date_approved"),
        "external_reference": payment_data.get("external_reference"),
    }


@router.get("/order/{order_id}", status_code=status.HTTP_200_OK)
async def get_order_payment_info(
    order_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get payment information for an order.

    Returns current payment status, last payment record,
    and order payment fields. Used by frontend to poll
    status after redirect from MercadoPago.

    Args:
        order_id: Order ID to get payment info for
        current_user: Authenticated user (must be order owner)
        uow: Unit of work for database access

    Returns:
        dict: Order payment status, payment_method, paid_at, last pago record

    Raises:
        HTTPException 404: Order not found
        HTTPException 403: Not authorized
    """
    result = await uow.session.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.pagos))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found",
        )

    is_admin = getattr(current_user, "role", "").lower() == "admin"
    if order.user_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this order's payment info",
        )

    last_pago = order.pagos[-1] if order.pagos else None

    return {
        "order_id": order.id,
        "order_status": order.status.value if order.status else None,
        "payment_status": order.payment_status.value if order.payment_status else None,
        "payment_method": order.payment_method,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        "total_amount": float(order.total_amount),
        "mp_preference_id": order.mp_preference_id,
        "mp_payment_id": order.mp_payment_id,
        "last_payment": {
            "mp_payment_id": last_pago.mp_payment_id,
            "mp_status": last_pago.mp_status,
            "mp_status_detail": last_pago.mp_status_detail,
            "monto": float(last_pago.monto),
            "created_at": last_pago.created_at.isoformat(),
        } if last_pago else None,
    }
