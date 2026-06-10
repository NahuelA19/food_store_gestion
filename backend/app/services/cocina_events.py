"""Events for Kitchen Display System."""

import logging
from datetime import datetime, timezone

from app.dependencies import get_websocket_manager

logger = logging.getLogger(__name__)

async def broadcast_cocina_transition(
    order_id: int,
    estado_anterior: str | None,
    nuevo_estado: str
) -> None:
    """
    Broadcast an order transition event to connected KDS clients.
    """
    event_type = "PEDIDO_CONFIRMADO" if nuevo_estado == "CONFIRMADO" else "ESTADO_ACTUALIZADO"
    
    message = {
        "event": event_type,
        "order_id": order_id,
        "estado_anterior": estado_anterior,
        "estado_codigo": nuevo_estado,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # In a real app we'd get the manager from the app state.
    # Since this is called from services without Request context sometimes,
    # we need a better way to access the global manager.
    # For now we'll import it directly from where it was created in main.py,
    # or handle it gracefully if not available.
    try:
        from app.main import websocket_manager
        if websocket_manager:
            await websocket_manager.broadcast(message)
    except Exception as e:
        logger.error("Failed to broadcast cocina transition: %s", e)
