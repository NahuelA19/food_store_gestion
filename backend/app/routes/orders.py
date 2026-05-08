"""Order API routes for the Food Store."""

import logging
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_admin_user, get_current_user, get_db
from app.models.order import OrderStatus
from app.models.user import User
from app.schemas.order import (
    OrderDetailResponse,
    OrderListResponse,
    OrderStatusUpdate,
)
from app.services.order_service import (
    cancel_order,
    get_order_detail,
    get_user_orders,
    update_order_status,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/", response_model=OrderListResponse)
async def list_orders(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderListResponse:
    """List current user's orders (paginated, most recent first)."""
    return await get_user_orders(
        user_id=current_user.id,
        page=page,
        limit=limit,
        db=db,
    )


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderDetailResponse:
    """Get order details with line items."""
    return await get_order_detail(
        order_id=order_id,
        user_id=current_user.id,
        db=db,
        is_admin=current_user.role == "admin",
    )


@router.post("/{order_id}/cancel", response_model=OrderDetailResponse)
async def cancel_user_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderDetailResponse:
    """Cancel a pending order. Releases reserved inventory."""
    order = await cancel_order(
        order_id=order_id,
        user_id=current_user.id,
        db=db,
        is_admin=current_user.role == "admin",
    )
    logger.info(
        "Order cancelled: user_id=%s, order_id=%s",
        current_user.id, order_id,
    )
    return await get_order_detail(
        order_id=order.id,
        user_id=current_user.id,
        db=db,
        is_admin=current_user.role == "admin",
    )


@router.patch("/{order_id}/status", response_model=OrderDetailResponse)
async def update_status(
    order_id: int,
    body: OrderStatusUpdate,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
) -> OrderDetailResponse:
    """Update order status (admin only). Validates status transitions."""
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
        db=db,
    )
    logger.info(
        "Order status updated: order_id=%s, new_status=%s, by=%s",
        order_id, body.status, current_user.id,
    )
    return await get_order_detail(
        order_id=order.id,
        user_id=current_user.id,
        db=db,
        is_admin=True,
    )
