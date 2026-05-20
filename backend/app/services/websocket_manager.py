"""WebSocket connection manager for Kitchen Display System (KDS)."""

import asyncio
import logging
from typing import Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for KDS.
    
    Implements a pub/sub pattern (in-process) for broadcasting kitchen events.
    Version 1: Single-instance only (no Redis/external bus).
    """

    def __init__(self) -> None:
        """Initialize the connection manager with an empty set of active connections."""
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        """Register a new WebSocket connection.
        
        Args:
            websocket: The WebSocket connection to register.
        """
        async with self._lock:
            self.active_connections.add(websocket)
            logger.info(f"KDS connection established. Total connections: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket) -> None:
        """Unregister a WebSocket connection.
        
        Args:
            websocket: The WebSocket connection to unregister.
        """
        async with self._lock:
            self.active_connections.discard(websocket)
            logger.info(f"KDS connection closed. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict) -> None:
        """Broadcast a message to all connected KDS clients.
        
        If a connection fails, it's automatically removed from the active set.
        
        Args:
            message: Dictionary with keys: event, order_id, estado_codigo, timestamp, etc.
                    Example: {
                        "event": "PEDIDO_CONFIRMADO",
                        "order_id": 123,
                        "estado_codigo": "CONFIRMADO",
                        "timestamp": "2026-05-20T21:30:00+00:00"
                    }
        """
        # Create a copy of active connections to iterate over (avoid modification during iteration)
        async with self._lock:
            connections_to_send = list(self.active_connections)

        disconnected = []
        for websocket in connections_to_send:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to KDS client: {e}. Disconnecting.")
                disconnected.append(websocket)

        # Remove failed connections from the active set
        if disconnected:
            async with self._lock:
                for ws in disconnected:
                    self.active_connections.discard(ws)
            logger.info(f"Removed {len(disconnected)} failed connections. Total: {len(self.active_connections)}")

    async def get_connection_count(self) -> int:
        """Get the current number of active connections (for testing/monitoring)."""
        async with self._lock:
            return len(self.active_connections)
