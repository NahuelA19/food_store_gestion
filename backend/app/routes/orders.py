"""Order API routes for the Food Store."""

import logging
from datetime import datetime, timezone
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from app.core.uow import UnitOfWork
from app.dependencies import get_admin_user, get_current_user, get_uow, require_role
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.user import User
from app.schemas.order import (
    HistorialResponse,
    OrderDetailResponse,
    OrderListResponse,
    OrderStatusUpdate,
)
from app.services.order_service import (
    cancel_order,
    get_order_detail,
    get_order_historial,
    get_user_orders,
    transition,
    update_order_status,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])

# States each role is allowed to transition to (FSM códigos en UPPERCASE)
# Chef:   CONFIRMADO→EN_PREP, EN_PREP→LISTO
# Cajero: LISTO→EN_CAMINO, EN_CAMINO→ENTREGADO, cualquier→CANCELADO
#         (PENDIENTE→CONFIRMADO es exclusivo del endpoint pay-cash)
_CAJERO_ALLOWED_STATES = {"EN_CAMINO", "ENTREGADO", "CANCELADO"}
_CHEF_ALLOWED_STATES   = {"EN_PREP", "LISTO"}


@router.get("/", response_model=OrderListResponse)
async def list_orders(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: str | None = Query(None, description="Filter by order status"),
    search: str | None = Query(None, description="Search by order ID"),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> OrderListResponse:
    """List current user's orders (paginated, most recent first)."""
    return await get_user_orders(
        user_id=current_user.id,
        page=page,
        limit=limit,
        status=status,
        search=search,
        uow=uow,
    )


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> OrderDetailResponse:
    """Get order details with line items."""
    return await get_order_detail(
        order_id=order_id,
        user_id=current_user.id,
        uow=uow,
        is_admin=current_user.role == "admin",
    )


@router.post("/{order_id}/cancel", response_model=OrderDetailResponse)
async def cancel_user_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> OrderDetailResponse:
    """Cancel a pending order. Releases reserved inventory."""
    order = await cancel_order(
        order_id=order_id,
        user_id=current_user.id,
        uow=uow,
        is_admin=current_user.role == "admin",
    )
    logger.info(
        "Order cancelled: user_id=%s, order_id=%s",
        current_user.id, order_id,
    )
    return await get_order_detail(
        order_id=order.id,
        user_id=current_user.id,
        uow=uow,
        is_admin=current_user.role == "admin",
    )


@router.patch("/{order_id}/status", response_model=OrderDetailResponse)
async def update_status(
    order_id: int,
    body: OrderStatusUpdate,
    current_user: User = Depends(require_role("admin", "cajero", "chef")),
    uow: UnitOfWork = Depends(get_uow),
) -> OrderDetailResponse:
    """Update order status (admin, cajero, or chef). Validates status transitions and role permissions."""
    from app.services.order_service import _STATUS_TO_FSM

    role = current_user.role.lower()
    if role in ("cajero", "chef"):
        try:
            _enum = OrderStatus(body.status)
            _fsm_target = _STATUS_TO_FSM.get(_enum, body.status.upper())
        except ValueError:
            _fsm_target = body.status.upper()

        if role == "cajero" and _fsm_target not in _CAJERO_ALLOWED_STATES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cajero no puede cambiar el estado a '{body.status}'. "
                       f"Estados permitidos: {sorted(_CAJERO_ALLOWED_STATES)}",
            )
        if role == "chef" and _fsm_target not in _CHEF_ALLOWED_STATES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Chef no puede cambiar el estado a '{body.status}'. "
                       f"Estados permitidos: {sorted(_CHEF_ALLOWED_STATES)}",
            )

    try:
        new_status = OrderStatus(body.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: '{body.status}'. Valid values: {[s.value for s in OrderStatus]}",
        )

    order = await update_order_status(
        order_id=order_id,
        new_status=new_status,
        admin_id=current_user.id,
        uow=uow,
    )
    logger.info(
        "Order status updated: order_id=%s, new_status=%s, by=%s",
        order_id, body.status, current_user.id,
    )
    return await get_order_detail(
        order_id=order.id,
        user_id=current_user.id,
        uow=uow,
        is_admin=True,
    )


@router.post("/{order_id}/pay-cash", response_model=OrderDetailResponse)
async def pay_cash(
    order_id: int,
    current_user: User = Depends(require_role("admin", "cajero")),
    uow: UnitOfWork = Depends(get_uow),
) -> OrderDetailResponse:
    """Mark an EFECTIVO order as paid in cash (cajero or admin only)."""
    result = await uow.session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")

    if order.payment_method != "EFECTIVO":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este endpoint solo aplica a pedidos con método de pago EFECTIVO",
        )

    payment_status_value = (
        order.payment_status.value
        if order.payment_status and hasattr(order.payment_status, "value")
        else order.payment_status
    )
    if payment_status_value != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El pedido ya fue procesado (payment_status={payment_status_value})",
        )

    await transition(
        order,
        "CONFIRMADO",
        usuario_id=current_user.id,
        session=uow.session,
        motivo="Pago en efectivo registrado por cajero",
    )
    order.payment_status = PaymentStatus.APPROVED
    order.paid_at = datetime.now(timezone.utc)
    uow.session.add(order)
    await uow.commit()

    logger.info("Cash payment registered: order_id=%s, by=%s", order_id, current_user.id)
    return await get_order_detail(order_id=order.id, user_id=current_user.id, uow=uow, is_admin=True)


@router.patch("/{order_id}/switch-payment-method", response_model=OrderDetailResponse)
async def switch_payment_method(
    order_id: int,
    method: str = Query(..., description="New payment method: EFECTIVO or MERCADOPAGO"),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> OrderDetailResponse:
    """Switch payment method for a pending order (customer only, while payment is still pending)."""
    result = await uow.session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")

    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tenés acceso a este pedido")

    payment_status_value = (
        order.payment_status.value
        if order.payment_status and hasattr(order.payment_status, "value")
        else order.payment_status
    )
    if payment_status_value not in ("pending", "failed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede cambiar el método de pago: el pedido ya fue procesado (payment_status={payment_status_value})",
        )

    if order.estado_codigo not in ("PENDIENTE",):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede cambiar el método de pago en estado '{order.estado_codigo}'",
        )

    new_method = method.upper()
    if new_method not in ("EFECTIVO", "MERCADOPAGO"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Método de pago inválido. Usar EFECTIVO o MERCADOPAGO")

    order.payment_method = new_method
    if payment_status_value == "failed":
        order.payment_status = PaymentStatus.PENDING
    uow.session.add(order)
    await uow.commit()

    logger.info("Payment method switched: order_id=%s, new_method=%s, by=%s", order_id, new_method, current_user.id)
    return await get_order_detail(order_id=order.id, user_id=current_user.id, uow=uow, is_admin=current_user.role == "admin")


@router.get("/{order_id}/historial", response_model=list[HistorialResponse])
async def get_historial(
    order_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> list[HistorialResponse]:
    """Get the FSM state transition history for an order.

    Accessible by the order owner or admin.
    """
    result = await uow.session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found",
        )

    if current_user.role != "admin" and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found",
        )

    return await get_order_historial(order_id=order_id, uow=uow)
