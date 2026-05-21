"""Kitchen Display System (KDS) routes for Food Store."""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select, and_, or_

from app.core.uow import UnitOfWork
from app.dependencies import get_current_user, get_uow, require_role
from app.models.user import User
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.historial_estado_pedido import HistorialEstadoPedido
from app.schemas.kitchen import KitchenOrderResponse, KitchenOrderListResponse
from app.security.jwt import verify_token
from app.services.websocket_manager import ConnectionManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cocina", tags=["kitchen"])

# Global connection manager instance (will be set by main.py during lifespan)
_websocket_manager: ConnectionManager | None = None


def set_websocket_manager(manager: ConnectionManager) -> None:
    """Set the global WebSocket manager (called during app lifespan)."""
    global _websocket_manager
    _websocket_manager = manager


@router.get("/pedidos", response_model=KitchenOrderListResponse, dependencies=[Depends(require_role("COCINA", "PEDIDOS", "ADMIN"))])
async def list_kitchen_orders(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> KitchenOrderListResponse:
    """
    List orders in CONFIRMADO or EN_PREP state, ordered by date entered into kitchen.
    
    Only accessible to COCINA, PEDIDOS, or ADMIN roles.
    Implements RN-CO01 and RN-CO02:
    - RN-CO01: Cocina solo ve pedidos en CONFIRMADO y EN_PREP
    - RN-CO02: Pedidos ordenados por antigüedad ascendente (el que entró primero, primero)
    
    Note: UoW context is already managed by the get_uow dependency.
    """
    # Subquery: find the created_at when each order entered CONFIRMADO state
    # (this is the time they entered the kitchen queue)
    kitchen_entry_time = (
        select(HistorialEstadoPedido.created_at)
        .where(
            and_(
                HistorialEstadoPedido.pedido_id == Order.id,
                HistorialEstadoPedido.estado_hasta == "CONFIRMADO"
            )
        )
        .order_by(HistorialEstadoPedido.created_at.asc())
        .limit(1)
        .correlate(Order)
        .scalar_subquery()
    )
    
    # Main query: get orders in CONFIRMADO or EN_PREP, ordered by their kitchen entry time
    stmt = (
        select(Order)
        .where(or_(
            Order.estado_codigo == "CONFIRMADO",
            Order.estado_codigo == "EN_PREP"
        ))
        .order_by(kitchen_entry_time.asc())
    )
    
    result = await uow.session.execute(stmt)
    orders = result.scalars().all()
    
    # Build response with enriched data
    orders_response = []
    for order in orders:
        # Get items for this order
        items_stmt = select(OrderItem).where(OrderItem.order_id == order.id)
        items_result = await uow.session.execute(items_stmt)
        items = items_result.scalars().all()
        
        # Get the historial entry to find kitchen entry time
        hist_stmt = (
            select(HistorialEstadoPedido.created_at)
            .where(
                and_(
                    HistorialEstadoPedido.pedido_id == order.id,
                    HistorialEstadoPedido.estado_hasta == "CONFIRMADO"
                )
            )
            .order_by(HistorialEstadoPedido.created_at.asc())
            .limit(1)
        )
        hist_result = await uow.session.execute(hist_stmt)
        kitchen_entry = hist_result.scalar()
        
        # Build item list with snapshots
        items_list = [
            {
                "id": item.id,
                "nombre_snapshot": item.nombre_snapshot or item.product_name or f"Producto {item.product_id}",
                "cantidad": item.quantity,
                "precio_snapshot": item.precio_snapshot or item.unit_price,
            }
            for item in items
        ]
        
        orders_response.append(KitchenOrderResponse(
            id=order.id,
            estado_codigo=order.estado_codigo,
            notas=order.notas or "",
            items=items_list,
            kitchen_entry_at=kitchen_entry or order.created_at,
        ))
    
    return KitchenOrderListResponse(items=orders_response, total=len(orders_response))


@router.websocket("/ws")
async def websocket_kitchen_display(
    websocket: WebSocket,
    token: str = Query(...),
) -> None:
    """
    WebSocket endpoint for Kitchen Display System (KDS).
    
    Authentication via JWT in query parameter.
    Only users with COCINA, PEDIDOS, or ADMIN roles can connect.
    
    Implements RN-CO05: Emit events in real-time to connected KDS clients.
    
    Flow:
    1. Validate JWT from query param
    2. Verify user has required role
    3. Accept connection and register with ConnectionManager
    4. Keep connection alive (receive_text loop)
    5. On disconnect, unregister from ConnectionManager
    """
    # Validate JWT and get current user
    try:
        payload = verify_token(token)
        if not payload:
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token structure")
            return
    except Exception as e:
        logger.warning(f"WebSocket JWT validation failed: {e}")
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    # TODO: Verify user exists and has required role (COCINA, PEDIDOS, ADMIN)
    # For now, accept any valid JWT (will be enhanced with actual role check)
    
    if not _websocket_manager:
        logger.error("WebSocket manager not initialized")
        await websocket.close(code=1011, reason="Server error")
        return
    
    await websocket.accept()
    await _websocket_manager.connect(websocket)
    logger.info(f"KDS client connected (user_id={user_id})")
    
    try:
        # Keep connection alive
        while True:
            # Just receive text to keep the connection open
            # The KDS is a display-only interface (unidirectional push from server)
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info(f"KDS client disconnected (user_id={user_id})")
        await _websocket_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await _websocket_manager.disconnect(websocket)

