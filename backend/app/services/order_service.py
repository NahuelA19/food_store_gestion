"""Order business logic service."""

import logging
from datetime import datetime, timezone
from decimal import Decimal
from math import ceil

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import Cart
from app.models.inventory import Inventory
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.cart import CheckoutRequest
from app.schemas.order import (
    OrderDetailResponse,
    OrderItemResponse,
    OrderListResponse,
    OrderResponse,
)
from app.services.notification_service import create_order_notification
from app.services.recommendation_service import recommendation_service

logger = logging.getLogger(__name__)

# Valid status transitions for admin updates
VALID_TRANSITIONS: dict[OrderStatus, list[OrderStatus]] = {
    OrderStatus.PAYMENT_PENDING: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
    OrderStatus.PAYMENT_FAILED: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
    OrderStatus.PAID: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    OrderStatus.CONFIRMED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    OrderStatus.SHIPPED: [OrderStatus.DELIVERED],
    OrderStatus.DELIVERED: [],
    OrderStatus.CANCELLED: [],
}


async def create_order_from_cart(
    cart: Cart,
    body: CheckoutRequest,
    db: AsyncSession,
) -> Order:
    """Create an Order and OrderItems from a checked-out cart.

    Args:
        cart: Cart with items and products loaded (via selectinload)
        body: Checkout request details
        db: Database session

    Returns:
        Order: The newly created order

    Raises:
        HTTPException 409: If insufficient stock for any item
    """
    # Calculate total from cart (subtotal + tax) matching get_cart_response logic
    subtotal = Decimal("0.00")
    for item in cart.items:
        subtotal += item.unit_price * item.quantity

    tax_rate = Decimal("0.10")
    tax = (subtotal * tax_rate).quantize(Decimal("0.01"))
    total_amount = (subtotal + tax).quantize(Decimal("0.01"))

    # Create the order
    order = Order(
        user_id=cart.user_id,
        status=OrderStatus.PAYMENT_PENDING,
        total_amount=total_amount,
        payment_status=PaymentStatus.PENDING,
        status_history=[
            {
                "from": None,
                "to": OrderStatus.PAYMENT_PENDING.value,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "by": cart.user_id,
            }
        ],
    )
    db.add(order)
    await db.flush()  # Get order.id

    # Create order items and reserve inventory atomically
    for cart_item in cart.items:
        product = cart_item.product
        if product is None:
            result = await db.execute(
                select(Product).where(Product.id == cart_item.product_id)
            )
            product = result.scalar_one_or_none()

        # Check and reserve inventory
        inv_result = await db.execute(
            select(Inventory).where(Inventory.product_id == cart_item.product_id)
        )
        inventory = inv_result.scalar_one_or_none()

        if inventory:
            if inventory.available_quantity < cart_item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Insufficient stock for '{product.name if product else cart_item.product_id}'. "
                        f"Available: {inventory.available_quantity}, requested: {cart_item.quantity}"
                    ),
                )
            inventory.reserved_quantity += cart_item.quantity
            db.add(inventory)

        order_item = OrderItem(
            order_id=order.id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            unit_price=cart_item.unit_price,
        )
        db.add(order_item)

    await db.flush()
    await db.refresh(order)

    # Invalidate recommendation caches — orders changed
    recommendation_service.invalidate_all()

    return order


async def get_user_orders(
    user_id: int,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = None,
) -> OrderListResponse:
    """Get paginated list of orders for a user.

    Args:
        user_id: User ID
        page: Page number (1-indexed)
        limit: Items per page (max 100)
        db: Database session

    Returns:
        OrderListResponse: Paginated order list
    """
    page = max(1, page)
    limit = min(max(1, limit), 100)

    # Get total count
    count_result = await db.execute(
        select(func.count(Order.id)).where(Order.user_id == user_id)
    )
    total = count_result.scalar_one()

    # Get paginated orders
    offset = (page - 1) * limit
    result = await db.execute(
        select(Order)
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    orders = result.scalars().all()

    total_pages = max(1, ceil(total / limit)) if total > 0 else 1

    return OrderListResponse(
        items=[
            OrderResponse(
                id=o.id,
                user_id=o.user_id,
                status=o.status.value if hasattr(o.status, "value") else o.status,
                total_amount=o.total_amount,
                created_at=o.created_at,
            )
            for o in orders
        ],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


async def get_order_detail(
    order_id: int,
    user_id: int,
    db: AsyncSession,
    is_admin: bool = False,
) -> OrderDetailResponse:
    """Get order detail with items.

    Args:
        order_id: Order ID
        user_id: User ID (for ownership check)
        db: Database session
        is_admin: Skip ownership check if True

    Returns:
        OrderDetailResponse: Order with items

    Raises:
        HTTPException 404: Order not found or not owned by user
    """
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found",
        )

    if not is_admin and order.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found",
        )

    items_response = []
    for item in order.items:
        product_name = item.product.name if item.product else None
        items_response.append(
            OrderItemResponse(
                id=item.id,
                order_id=item.order_id,
                product_id=item.product_id,
                product_name=product_name,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
        )

    return OrderDetailResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status.value if hasattr(order.status, "value") else order.status,
        total_amount=order.total_amount,
        status_history=order.status_history,
        payment_status=order.payment_status.value if order.payment_status and hasattr(order.payment_status, "value") else order.payment_status,
        stripe_payment_intent_id=order.stripe_payment_intent_id,
        payment_method=order.payment_method,
        paid_at=order.paid_at,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items_response,
    )


async def cancel_order(
    order_id: int,
    user_id: int,
    db: AsyncSession,
    is_admin: bool = False,
) -> Order:
    """Cancel a pending order and release reserved inventory.

    Args:
        order_id: Order ID
        user_id: User ID (for ownership check)
        db: Database session
        is_admin: Allow cancelling any user's order

    Returns:
        Order: The cancelled order

    Raises:
        HTTPException 400: Order cannot be cancelled
        HTTPException 404: Order not found
    """
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found",
        )

    if not is_admin and order.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found",
        )

    if order.status not in (OrderStatus.PAYMENT_PENDING, OrderStatus.PAYMENT_FAILED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order in status '{order.status.value}'",
        )

    # Update status
    order.status = OrderStatus.CANCELLED

    # Track status change
    history_entry = {
        "from": order.status.value,
        "to": OrderStatus.CANCELLED.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "by": user_id,
    }
    if order.status_history is None:
        order.status_history = []
    order.status_history.append(history_entry)  # type: ignore[union-attr]

    # Release reserved inventory
    await _release_inventory_for_order(order, db)

    db.add(order)
    await db.commit()
    await db.refresh(order)

    # Invalidate recommendation caches
    recommendation_service.invalidate_all()

    # Trigger notification (fire-and-forget — never fail the request)
    try:
        await create_order_notification(
            db=db,
            order_id=order.id,
            user_id=order.user_id,
            new_status=OrderStatus.CANCELLED,
        )
    except Exception as e:
        logger.error("Failed to create notification for order %d: %s", order.id, e)

    return order


async def update_order_status(
    order_id: int,
    new_status: OrderStatus,
    admin_id: int,
    db: AsyncSession,
) -> Order:
    """Update order status with transition validation (admin only).

    Args:
        order_id: Order ID
        new_status: Target status
        admin_id: Admin user ID
        db: Database session

    Returns:
        Order: The updated order

    Raises:
        HTTPException 400: Invalid status transition
        HTTPException 404: Order not found
    """
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found",
        )

    old_status = order.status

    # Validate transition
    allowed = VALID_TRANSITIONS.get(old_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{old_status.value}' to '{new_status.value}'",
        )

    order.status = new_status

    # Track status change
    history_entry = {
        "from": old_status.value,
        "to": new_status.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "by": admin_id,
    }
    if order.status_history is None:
        order.status_history = []
    order.status_history.append(history_entry)

    db.add(order)
    await db.commit()
    await db.refresh(order)

    # Invalidate recommendation caches
    recommendation_service.invalidate_all()

    return order


async def _release_inventory_for_order(
    order: Order,
    db: AsyncSession,
) -> None:
    """Release reserved inventory for all items in an order.

    Args:
        order: Order with items loaded (via selectinload)
        db: Database session
    """
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
