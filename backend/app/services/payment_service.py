"""Stripe payment integration service."""

import logging
from datetime import datetime, timezone

import stripe
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models.inventory import Inventory
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.user import User

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.stripe_secret_key


async def _get_or_create_stripe_customer(
    user: User,
    db: AsyncSession,
) -> str:
    """Get existing Stripe customer ID or create a new one.

    Args:
        user: The user to get/create a Stripe customer for
        db: Database session

    Returns:
        str: Stripe customer ID
    """
    if user.stripe_customer_id:
        return user.stripe_customer_id

    # Create Stripe customer
    try:
        customer = stripe.Customer.create(
            email=user.email,
            metadata={"user_id": str(user.id)},
        )
    except stripe.error.StripeError as e:
        logger.error("Failed to create Stripe customer: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment service unavailable",
        )

    # Save customer ID to user
    user.stripe_customer_id = customer.id
    db.add(user)
    await db.flush()

    return customer.id


async def create_payment_intent(
    order: Order,
    user: User,
    db: AsyncSession,
) -> dict:
    """Create a Stripe PaymentIntent for an order.

    Creates a Stripe Customer if the user doesn't have one yet (lazy creation).

    Args:
        order: The order to create a PaymentIntent for
        user: The user placing the order
        db: Database session

    Returns:
        dict: Contains 'client_secret' and 'payment_intent_id'

    Raises:
        HTTPException 502: If Stripe API call fails
    """
    customer_id = await _get_or_create_stripe_customer(user, db)

    # Convert amount to cents (Stripe uses smallest currency unit)
    amount_cents = int(order.total_amount * 100)

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            customer=customer_id,
            metadata={
                "order_id": str(order.id),
                "user_id": str(user.id),
            },
        )
    except stripe.error.StripeError as e:
        logger.error("Failed to create PaymentIntent for order %s: %s", order.id, e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment service unavailable",
        )

    # Save PaymentIntent info on order
    order.stripe_payment_intent_id = intent.id
    order.stripe_customer_id = customer_id
    db.add(order)
    await db.flush()

    return {
        "client_secret": intent.client_secret,
        "payment_intent_id": intent.id,
    }


async def handle_webhook_event(
    payload: bytes,
    sig_header: str,
) -> dict:
    """Verify and process a Stripe webhook event.

    Args:
        payload: Raw request body
        sig_header: Stripe-Signature header value

    Returns:
        dict: Processed event summary

    Raises:
        HTTPException 400: If signature verification fails
    """
    endpoint_secret = settings.stripe_webhook_secret

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=endpoint_secret,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload",
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        )

    return {
        "type": event["type"],
        "id": event["id"],
        "data": event["data"],
    }


async def handle_payment_succeeded(
    payment_intent_id: str,
    db: AsyncSession,
) -> Order:
    """Handle payment_intent.succeeded webhook event.

    Confirms the order, decrements actual stock, clears reservation.

    Args:
        payment_intent_id: Stripe PaymentIntent ID
        db: Database session

    Returns:
        Order: Updated order

    Raises:
        HTTPException 404: If order not found
    """
    # Find order by PaymentIntent ID
    result = await db.execute(
        select(Order)
        .where(Order.stripe_payment_intent_id == payment_intent_id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()

    if not order:
        logger.warning("Order not found for PaymentIntent: %s", payment_intent_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if order.status != OrderStatus.PAYMENT_PENDING:
        logger.info(
            "Order %s already processed (status: %s), skipping",
            order.id, order.status,
        )
        return order

    # Update order status
    old_status = order.status
    order.status = OrderStatus.PAID
    order.payment_status = PaymentStatus.SUCCEEDED
    order.paid_at = datetime.now(timezone.utc)

    # Track status change
    history_entry = {
        "from": old_status.value,
        "to": OrderStatus.PAID.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "by": "stripe_webhook",
    }
    if order.status_history is None:
        order.status_history = []
    order.status_history.append(history_entry)  # type: ignore[union-attr]

    # Decrement actual stock (move from reserved to sold)
    for item in order.items:
        inv_result = await db.execute(
            select(Inventory).where(Inventory.product_id == item.product_id)
        )
        inventory = inv_result.scalar_one_or_none()
        if inventory:
            inventory.reserved_quantity = max(
                0, inventory.reserved_quantity - item.quantity
            )
            inventory.stock_quantity = max(
                0, inventory.stock_quantity - item.quantity
            )
            db.add(inventory)

    db.add(order)
    await db.commit()
    await db.refresh(order)

    logger.info(
        "Payment succeeded for order %s (PaymentIntent: %s)",
        order.id, payment_intent_id,
    )
    return order


async def handle_payment_failed(
    payment_intent_id: str,
    db: AsyncSession,
) -> Order:
    """Handle payment_intent.payment_failed webhook event.

    Marks order as failed and releases reserved inventory.

    Args:
        payment_intent_id: Stripe PaymentIntent ID
        db: Database session

    Returns:
        Order: Updated order
    """
    result = await db.execute(
        select(Order)
        .where(Order.stripe_payment_intent_id == payment_intent_id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()

    if not order:
        logger.warning("Order not found for failed PaymentIntent: %s", payment_intent_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if order.status != OrderStatus.PAYMENT_PENDING:
        return order

    # Update order status
    old_status = order.status
    order.status = OrderStatus.PAYMENT_FAILED
    order.payment_status = PaymentStatus.FAILED

    # Track status change
    history_entry = {
        "from": old_status.value,
        "to": OrderStatus.PAYMENT_FAILED.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "by": "stripe_webhook",
    }
    if order.status_history is None:
        order.status_history = []
    order.status_history.append(history_entry)  # type: ignore[union-attr]

    # Release reserved inventory
    for item in order.items:
        inv_result = await db.execute(
            select(Inventory).where(Inventory.product_id == item.product_id)
        )
        inventory = inv_result.scalar_one_or_none()
        if inventory:
            inventory.reserved_quantity = max(
                0, inventory.reserved_quantity - item.quantity
            )
            db.add(inventory)

    db.add(order)
    await db.commit()
    await db.refresh(order)

    logger.info(
        "Payment failed for order %s (PaymentIntent: %s)",
        order.id, payment_intent_id,
    )
    return order
