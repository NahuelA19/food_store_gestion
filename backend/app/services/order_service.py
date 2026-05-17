"""Order business logic service."""

import logging
from datetime import datetime, timezone
from decimal import Decimal
from math import ceil

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.uow import UnitOfWork

from app.models.cart import Cart
from app.models.historial_estado_pedido import HistorialEstadoPedido
from app.models.inventory import Inventory
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.cart import CheckoutRequest
from app.schemas.order import (
    HistorialResponse,
    OrderDetailResponse,
    OrderItemResponse,
    OrderListResponse,
    OrderResponse,
)
from app.services.notification_service import create_order_notification

logger = logging.getLogger(__name__)

# FSM state transitions — keys/values refer to estados_pedido.codigo
FSM_TRANSITIONS: dict[str, list[str]] = {
    "PENDIENTE": ["CONFIRMADO", "CANCELADO"],       # Pago via IPN → CONFIRMADO
    "CONFIRMADO": ["EN_PREP", "CANCELADO"],          # Admin prepara o cancela
    "EN_PREP": ["EN_CAMINO", "CANCELADO"],           # Sale a delivery o se cancela
    "EN_CAMINO": ["ENTREGADO"],                      # Se entrega (terminal)
    "ENTREGADO": [],                                  # Terminal
    "CANCELADO": [],                                  # Terminal
}

# Map FSM codigo → OrderStatus for backward compatibility of the `status` column
# IMPORTANT: PostgreSQL SQLEnum stores the Python enum member NAME (key), not the .value string.
# The DB has: PENDING, CONFIRMED, DELIVERED, CANCELLED, EN_PREP, EN_CAMINO, PENDIENTE, etc.
# We map to enum members whose NAME matches what the DB already stores.
_FSM_TO_STATUS: dict[str, OrderStatus] = {
    "PENDIENTE": OrderStatus.PENDIENTE,   # Name=PENDIENTE, DB stores 'PENDIENTE' ✓
    "CONFIRMADO": OrderStatus.CONFIRMED,  # Name=CONFIRMED, DB stores 'CONFIRMED' ✓
    "EN_PREP": OrderStatus.EN_PREP,       # Name=EN_PREP, DB stores 'EN_PREP' ✓
    "EN_CAMINO": OrderStatus.EN_CAMINO,   # Name=EN_CAMINO, DB stores 'EN_CAMINO' ✓
    "ENTREGADO": OrderStatus.DELIVERED,   # Name=DELIVERED, DB stores 'DELIVERED' ✓
    "CANCELADO": OrderStatus.CANCELLED,   # Name=CANCELLED, DB stores 'CANCELLED' ✓
}

# Reverse map: OrderStatus → FSM codigo
_STATUS_TO_FSM: dict[OrderStatus, str] = {v: k for k, v in _FSM_TO_STATUS.items()}
# Extra aliases (old enum values mapping to new FSM states)
_STATUS_TO_FSM[OrderStatus.CONFIRMED] = "CONFIRMADO"
_STATUS_TO_FSM[OrderStatus.DELIVERED] = "ENTREGADO"
_STATUS_TO_FSM[OrderStatus.CANCELLED] = "CANCELADO"


async def transition(
    order: Order,
    nuevo_estado: str,
    usuario_id: int | None,
    session: AsyncSession,
    motivo: str | None = None,
) -> None:
    """Validate and execute a state machine transition for an order."""
    if not order.estado_codigo:
        raise HTTPException(
            status_code=422,
            detail="El pedido no tiene un estado FSM inicial.",
        )

    validos = FSM_TRANSITIONS.get(order.estado_codigo, [])
    if nuevo_estado not in validos:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Transición inválida: {order.estado_codigo} → {nuevo_estado}. "
                f"Transiciones permitidas: {', '.join(validos) if validos else 'ninguna (estado terminal)'}"
            ),
        )

    historial = HistorialEstadoPedido(
        pedido_id=order.id,
        estado_desde=order.estado_codigo,
        estado_hasta=nuevo_estado,
        usuario_id=usuario_id,
        motivo=motivo,
    )
    session.add(historial)
    order.estado_codigo = nuevo_estado
    # Sync legacy status field for backward compatibility
    if nuevo_estado in _FSM_TO_STATUS:
        order.status = _FSM_TO_STATUS[nuevo_estado]


async def create_order_from_cart(
    cart: Cart,
    body: CheckoutRequest,
    uow: UnitOfWork,
    direccion_entrega_id: int | None = None,
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
        status=OrderStatus.PENDIENTE,
        estado_codigo="PENDIENTE",
        total_amount=total_amount,
        payment_status=PaymentStatus.PENDING,
        status_history=[
            {
                "from": None,
                "to": OrderStatus.PENDIENTE.value,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "by": cart.user_id,
            }
        ],
    )
    uow.session.add(order)
    await uow.flush()  # Get order.id

    # Handle shipping address snapshot
    if direccion_entrega_id:
        from app.models.direccion_entrega import DireccionEntrega
        direccion = await uow.direcciones.get(direccion_entrega_id)
        if not direccion:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Dirección no encontrada")
        if direccion.usuario_id != cart.user_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="La dirección no pertenece al usuario")
        order.direccion_entrega_id = direccion.id
        order.direccion_snapshot = {
            "direccion": direccion.direccion,
            "ciudad": direccion.ciudad,
            "provincia": direccion.provincia,
            "codigo_postal": direccion.codigo_postal,
        }

    # Create initial FSM historial entry
    historial_inicial = HistorialEstadoPedido(
        pedido_id=order.id,
        estado_desde=None,
        estado_hasta="PENDIENTE",
        usuario_id=cart.user_id,
        motivo="Pedido creado",
    )
    uow.session.add(historial_inicial)

    # Create order items and reserve inventory atomically
    for cart_item in cart.items:
        product = cart_item.product
        if product is None:
            result = await uow.session.execute(
                select(Product).where(Product.id == cart_item.product_id)
            )
            product = result.scalar_one_or_none()

        # Check and reserve inventory
        inv_result = await uow.session.execute(
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
            uow.session.add(inventory)

        order_item = OrderItem(
            order_id=order.id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            unit_price=cart_item.unit_price,
            nombre_snapshot=product.name if product else None,
            precio_snapshot=product.price if product else None,
        )
        uow.session.add(order_item)

    await uow.flush()
    await uow.refresh(order)

    return order


# Maps each frontend filter key to all DB enum values that belong to that group.
# The enum has Spanish + English aliases for the same semantic state.
STATUS_FILTER_GROUPS: dict[str, list[str]] = {
    "payment_pending": ["pendiente", "pending", "pago_pendiente", "payment_pending"],
    "confirmado":      ["confirmado", "confirmed", "pagado", "paid"],
    "en_prep":         ["en_prep", "preparando", "listo", "ready"],
    "en_camino":       ["en_camino", "enviado", "shipped"],
    "entregado":       ["entregado", "delivered"],
    "cancelado":       ["cancelado", "cancelled", "pago_fallido", "payment_failed"],
}


def build_status_condition(status: str):
    """Return a SQLAlchemy condition for a status filter key (handles alias groups)."""
    group = STATUS_FILTER_GROUPS.get(status.lower())
    if group:
        valid = [v for v in group if any(e.value == v for e in OrderStatus)]
        if valid:
            return Order.status.in_(valid)
    # Fallback: exact match via enum
    try:
        return Order.status == OrderStatus(status.lower())
    except ValueError:
        return None


async def get_user_orders(
    user_id: int,
    page: int = 1,
    limit: int = 20,
    status: str | None = None,
    search: str | None = None,
    uow: UnitOfWork = None,
) -> OrderListResponse:
    """Get paginated list of orders for a user, with optional status and search filters."""
    page = max(1, page)
    limit = min(max(1, limit), 100)

    conditions = [Order.user_id == user_id]

    if status:
        cond = build_status_condition(status)
        if cond is not None:
            conditions.append(cond)

    if search and search.strip().isdigit():
        conditions.append(Order.id == int(search.strip()))

    where_clause = and_(*conditions)

    # Get total count
    count_result = await uow.session.execute(
        select(func.count(Order.id)).where(where_clause)
    )
    total = count_result.scalar_one()

    # Get paginated orders
    offset = (page - 1) * limit
    result = await uow.session.execute(
        select(Order)
        .where(where_clause)
        .options(selectinload(Order.user))
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
                user_email=o.user.email if o.user else None,
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
    uow: UnitOfWork,
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
    result = await uow.session.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .options(selectinload(Order.user))
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

    # Use the FSM historial table instead of the legacy JSON field
    status_history = []
    if order.historial:
        status_history = [
            HistorialResponse.model_validate(h) for h in order.historial
        ]

    return OrderDetailResponse(
        id=order.id,
        user_id=order.user_id,
        user_email=order.user.email if order.user else None,
        status=order.status.value if hasattr(order.status, "value") else order.status,
        total_amount=order.total_amount,
        status_history=status_history,
        payment_status=order.payment_status.value if order.payment_status and hasattr(order.payment_status, "value") else order.payment_status,
        payment_method=order.payment_method,
        paid_at=order.paid_at,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items_response,
    )


async def cancel_order(
    order_id: int,
    user_id: int,
    uow: UnitOfWork,
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
    result = await uow.session.execute(
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

    # Capture old estado before transition
    old_estado = order.estado_codigo

    # Use FSM transition (validates state machine internally)
    await transition(order, "CANCELADO", user_id, uow.session, motivo="Cancelación solicitada")

    # Track status change (legacy JSON history for backward compat)
    history_entry = {
        "from": old_estado,
        "to": OrderStatus.CANCELADO.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "by": user_id,
    }
    if order.status_history is None:
        order.status_history = []
    order.status_history.append(history_entry)  # type: ignore[union-attr]

    # Release reserved inventory
    await _release_inventory_for_order(order, uow)

    uow.session.add(order)
    await uow.flush()
    await uow.refresh(order)

    # Trigger notification (fire-and-forget — never fail the request)
    try:
        await create_order_notification(
            uow=uow,
            order_id=order.id,
            user_id=order.user_id,
            new_status=OrderStatus.CANCELADO,
        )
    except Exception as e:
        logger.error("Failed to create notification for order %d: %s", order.id, e)

    return order


async def update_order_status(
    order_id: int,
    new_status: OrderStatus,
    admin_id: int,
    uow: UnitOfWork,
) -> Order:
    """Update order status with FSM validation (admin only).

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
        HTTPException 422: Invalid FSM transition
    """
    result = await uow.session.execute(
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

    # Map requested OrderStatus → FSM codigo
    nuevo_fsm = _STATUS_TO_FSM.get(new_status)
    if nuevo_fsm is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede transicionar a '{new_status.value}'",
        )

    # Block manual transition to CONFIRMADO — only allowed via MercadoPago webhook
    if nuevo_fsm == "CONFIRMADO":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transición a 'CONFIRMADO' solo permitida vía webhook de MercadoPago",
        )

    old_estado = order.estado_codigo

    # Execute FSM transition
    await transition(order, nuevo_fsm, admin_id, uow.session, motivo=f"Admin #{admin_id}")

    # Track status change (legacy JSON history for backward compat)
    history_entry = {
        "from": old_estado,
        "to": nuevo_fsm,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "by": admin_id,
    }
    if order.status_history is None:
        order.status_history = []
    order.status_history.append(history_entry)

    uow.session.add(order)
    await uow.flush()
    await uow.refresh(order)

    return order


async def get_order_historial(
    order_id: int,
    uow: UnitOfWork,
) -> list[HistorialResponse]:
    """Get the FSM state transition history for an order.

    Args:
        order_id: Order ID
        db: Database session

    Returns:
        list[HistorialResponse]: Ordered state transitions
    """
    result = await uow.session.execute(
        select(HistorialEstadoPedido)
        .where(HistorialEstadoPedido.pedido_id == order_id)
        .order_by(HistorialEstadoPedido.created_at)
    )
    entries = result.scalars().all()
    return [HistorialResponse.model_validate(e) for e in entries]


async def _release_inventory_for_order(
    order: Order,
    uow: UnitOfWork,
) -> None:
    """Release reserved inventory for all items in an order.

    Args:
        order: Order with items loaded (via selectinload)
        db: Database session
    """
    for item in order.items:
        inv_result = await uow.session.execute(
            select(Inventory).where(Inventory.product_id == item.product_id)
        )
        inventory = inv_result.scalar_one_or_none()
        if inventory:
            inventory.reserved_quantity = max(
                0, inventory.reserved_quantity - item.quantity
            )
            uow.session.add(inventory)
