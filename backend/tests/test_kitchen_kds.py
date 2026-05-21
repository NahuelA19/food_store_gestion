"""Kitchen Display System (KDS) comprehensive tests.

Tests cover the complete KDS workflow:
1. Authentication and authorization (roles required)
2. Order listing with proper filtering and ordering (RN-CO01, RN-CO02)
3. WebSocket connection and disconnection
4. Real-time event broadcasting (RN-CO05)
5. Order state transitions (FSM validation)
"""

import json
import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.user import User
from app.models.role import Role
from app.models.usuario_rol import UsuarioRol
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.category import Category
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.estado_pedido import EstadoPedido
from app.models.historial_estado_pedido import HistorialEstadoPedido
from app.security.password import get_password_hash
from app.security.jwt import create_access_token
from app.services.websocket_manager import ConnectionManager
from app.services.order_service import transition as fsm_transition


@pytest.fixture
async def kitchen_user(db_session: AsyncSession) -> User:
    """Create a user with COCINA role."""
    # Create COCINA role
    cocina_role = Role(codigo="COCINA", nombre="Kitchen Staff", descripcion="Kitchen staff")
    db_session.add(cocina_role)
    
    # Create user with COCINA role
    user = User(
        email="cocina@foodstore.com",
        hashed_password=get_password_hash("KitchenPassword123"),
        is_active=True,
        role="COCINA"
    )
    db_session.add(user)
    await db_session.flush()
    
    # Assign role via UsuarioRol (n:m relationship)
    user_role = UsuarioRol(usuario_id=user.id, rol_codigo="COCINA")
    db_session.add(user_role)
    
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_orders_in_kitchen(
    db_session: AsyncSession, kitchen_user: User
) -> tuple[Order, Order, Order]:
    """Create test orders in different kitchen states.
    
    Returns:
        - order_1: CONFIRMADO (first order to enter kitchen)
        - order_2: CONFIRMADO (second order to enter kitchen)
        - order_3: EN_PREP (order being prepared)
    """
    # Create category
    category = Category(name="Pizzas", description="Italian pizzas")
    db_session.add(category)
    await db_session.flush()
    
    # Create products
    product1 = Product(
        name="Margherita",
        description="Classic Margherita pizza",
        price=Decimal("12.50"),
        category_id=category.id,
        is_available=True
    )
    product2 = Product(
        name="Pepperoni",
        description="Pepperoni pizza",
        price=Decimal("14.50"),
        category_id=category.id,
        is_available=True
    )
    db_session.add_all([product1, product2])
    await db_session.flush()
    
    # Create inventory
    Inventory(product_id=product1.id, stock_quantity=100)
    Inventory(product_id=product2.id, stock_quantity=100)
    await db_session.flush()
    
    # Create CONFIRMADO and EN_PREP states
    base_time = datetime.utcnow()
    confirmado = EstadoPedido(
        codigo="CONFIRMADO",
        descripcion="Order confirmed by customer",
        es_terminal=False,
        created_at=base_time
    )
    en_prep = EstadoPedido(
        codigo="EN_PREP",
        descripcion="Order being prepared",
        es_terminal=False,
        created_at=base_time
    )
    db_session.add_all([confirmado, en_prep])
    await db_session.flush()
    
    # Order 1: CONFIRMADO, entered kitchen 2 minutes ago
    order1 = Order(
        user_id=kitchen_user.id,
        estado_codigo="CONFIRMADO",
        total_amount=Decimal("12.50"),
        status="confirmado",
        notas="Sin cebolla"
    )
    db_session.add(order1)
    await db_session.flush()
    
    item1 = OrderItem(
        order_id=order1.id,
        product_id=product1.id,
        quantity=1,
        unit_price=Decimal("12.50"),
        nombre_snapshot="Margherita",
        precio_snapshot=Decimal("12.50")
    )
    db_session.add(item1)
    
    # Add history entry for order1 (CONFIRMADO state, 2 min ago)
    hist1 = HistorialEstadoPedido(
        pedido_id=order1.id,
        estado_desde="PENDIENTE",
        estado_hasta="CONFIRMADO",
        created_at=base_time - timedelta(minutes=2)
    )
    db_session.add(hist1)
    
    # Order 2: CONFIRMADO, entered kitchen 1 minute ago
    order2 = Order(
        user_id=kitchen_user.id,
        estado_codigo="CONFIRMADO",
        total_amount=Decimal("14.50"),
        status="confirmado",
        notas=""
    )
    db_session.add(order2)
    await db_session.flush()
    
    item2 = OrderItem(
        order_id=order2.id,
        product_id=product2.id,
        quantity=1,
        unit_price=Decimal("14.50"),
        nombre_snapshot="Pepperoni",
        precio_snapshot=Decimal("14.50")
    )
    db_session.add(item2)
    
    hist2 = HistorialEstadoPedido(
        pedido_id=order2.id,
        estado_desde="PENDIENTE",
        estado_hasta="CONFIRMADO",
        created_at=base_time - timedelta(minutes=1)
    )
    db_session.add(hist2)
    
    # Order 3: EN_PREP (being prepared)
    order3 = Order(
        user_id=kitchen_user.id,
        estado_codigo="EN_PREP",
        total_amount=Decimal("12.50"),
        status="en_prep",
        notas="Extra queso"
    )
    db_session.add(order3)
    await db_session.flush()
    
    item3 = OrderItem(
        order_id=order3.id,
        product_id=product1.id,
        quantity=2,
        unit_price=Decimal("12.50"),
        nombre_snapshot="Margherita",
        precio_snapshot=Decimal("12.50")
    )
    db_session.add(item3)
    
    hist3_confirm = HistorialEstadoPedido(
        pedido_id=order3.id,
        estado_desde="PENDIENTE",
        estado_hasta="CONFIRMADO",
        created_at=base_time - timedelta(minutes=3)
    )
    hist3_prep = HistorialEstadoPedido(
        pedido_id=order3.id,
        estado_desde="CONFIRMADO",
        estado_hasta="EN_PREP",
        created_at=base_time - timedelta(minutes=1, seconds=30)
    )
    db_session.add_all([hist3_confirm, hist3_prep])
    
    await db_session.commit()
    await db_session.refresh(order1)
    await db_session.refresh(order2)
    await db_session.refresh(order3)
    
    return order1, order2, order3


class TestKitchenOrderListEndpoint:
    """Test GET /api/v1/cocina/pedidos endpoint."""

    @pytest.mark.asyncio
    async def test_list_kitchen_orders_requires_auth(self, async_client: AsyncClient):
        """Test that GET /cocina/pedidos requires authentication."""
        response = await async_client.get("/api/v1/cocina/pedidos")
        assert response.status_code == 401, "Should reject request without auth"

    @pytest.mark.asyncio
    async def test_list_kitchen_orders_requires_kitchen_role(
        self, db_session: AsyncSession, async_client: AsyncClient
    ):
        """Test that only COCINA/PEDIDOS/ADMIN roles can access the endpoint."""
        # Create user WITHOUT kitchen role
        user = User(
            email="regular@foodstore.com",
            hashed_password=get_password_hash("Password123"),
            is_active=True
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        # Create token for this user
        token = create_access_token(data={"user_id": user.id})
        
        # Try to access kitchen endpoint
        response = await async_client.get(
            "/api/v1/cocina/pedidos",
            headers={"Authorization": f"Bearer {token}"}
        )
        # Should be 403 Forbidden (no required role)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_list_kitchen_orders_filters_by_state(
        self,
        db_session: AsyncSession,
        async_client: AsyncClient,
        kitchen_user: User,
        test_orders_in_kitchen: tuple[Order, Order, Order],
    ):
        """Test that only CONFIRMADO and EN_PREP orders are returned (RN-CO01)."""
        token = create_access_token(data={"user_id": kitchen_user.id})
        
        response = await async_client.get(
            "/api/v1/cocina/pedidos",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have 3 orders (2 CONFIRMADO + 1 EN_PREP)
        assert data["total"] == 3
        assert len(data["items"]) == 3
        
        # All orders should have CONFIRMADO or EN_PREP state
        states = [order["estado_codigo"] for order in data["items"]]
        assert all(state in ["CONFIRMADO", "EN_PREP"] for state in states)

    @pytest.mark.asyncio
    async def test_list_kitchen_orders_ordered_by_entry_time(
        self,
        db_session: AsyncSession,
        async_client: AsyncClient,
        kitchen_user: User,
        test_orders_in_kitchen: tuple[Order, Order, Order],
    ):
        """Test that orders are sorted by kitchen entry time (oldest first) (RN-CO02)."""
        order1, order2, order3 = test_orders_in_kitchen
        
        token = create_access_token(data={"user_id": kitchen_user.id})
        response = await async_client.get(
            "/api/v1/cocina/pedidos",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Extract order IDs in response order
        response_order_ids = [order["id"] for order in data["items"]]
        
        # Expected order: order3 (3 min ago), order1 (2 min ago), order2 (1 min ago)
        assert response_order_ids == [order3.id, order1.id, order2.id]

    @pytest.mark.asyncio
    async def test_list_kitchen_orders_includes_items_and_notes(
        self,
        db_session: AsyncSession,
        async_client: AsyncClient,
        kitchen_user: User,
        test_orders_in_kitchen: tuple[Order, Order, Order],
    ):
        """Test that order items and notes are included in response."""
        order1, _, _ = test_orders_in_kitchen
        
        token = create_access_token(data={"user_id": kitchen_user.id})
        response = await async_client.get(
            "/api/v1/cocina/pedidos",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Find order1 in response
        order1_data = next((o for o in data["items"] if o["id"] == order1.id), None)
        assert order1_data is not None
        
        # Check items
        assert len(order1_data["items"]) > 0
        item = order1_data["items"][0]
        assert item["nombre_snapshot"] == "Margherita"
        assert item["cantidad"] == 1
        assert float(item["precio_snapshot"]) == 12.50
        
        # Check notes
        assert order1_data["notas"] == "Sin cebolla"

    @pytest.mark.asyncio
    async def test_list_kitchen_orders_empty_list(
        self,
        db_session: AsyncSession,
        async_client: AsyncClient,
        kitchen_user: User,
    ):
        """Test that endpoint returns empty list when no orders in kitchen."""
        token = create_access_token(data={"user_id": kitchen_user.id})
        response = await async_client.get(
            "/api/v1/cocina/pedidos",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []


class TestWebSocketManager:
    """Test ConnectionManager for WebSocket broadcasting."""

    @pytest.mark.asyncio
    async def test_connection_manager_connect(self):
        """Test that connect() adds connection to active set."""
        manager = ConnectionManager()
        mock_ws = AsyncMock()
        
        await manager.connect(mock_ws)
        
        assert mock_ws in manager.active_connections
        assert len(manager.active_connections) == 1

    @pytest.mark.asyncio
    async def test_connection_manager_disconnect(self):
        """Test that disconnect() removes connection from active set."""
        manager = ConnectionManager()
        mock_ws = AsyncMock()
        
        await manager.connect(mock_ws)
        assert len(manager.active_connections) == 1
        
        await manager.disconnect(mock_ws)
        assert len(manager.active_connections) == 0

    @pytest.mark.asyncio
    async def test_connection_manager_broadcast_to_all(self):
        """Test that broadcast() sends message to all connected clients."""
        manager = ConnectionManager()
        mock_ws1 = AsyncMock()
        mock_ws2 = AsyncMock()
        
        await manager.connect(mock_ws1)
        await manager.connect(mock_ws2)
        
        message = {
            "event": "PEDIDO_CONFIRMADO",
            "order_id": 123,
            "estado_codigo": "CONFIRMADO"
        }
        
        await manager.broadcast(message)
        
        # Both clients should receive the message
        mock_ws1.send_json.assert_called_once_with(message)
        mock_ws2.send_json.assert_called_once_with(message)

    @pytest.mark.asyncio
    async def test_connection_manager_broadcast_removes_failed_connections(self):
        """Test that broadcast() removes connections that fail to send."""
        manager = ConnectionManager()
        mock_ws1 = AsyncMock()
        mock_ws2 = AsyncMock()
        mock_ws3 = AsyncMock()
        
        # ws2 will fail to send
        mock_ws2.send_json.side_effect = Exception("Connection closed")
        
        await manager.connect(mock_ws1)
        await manager.connect(mock_ws2)
        await manager.connect(mock_ws3)
        
        assert len(manager.active_connections) == 3
        
        message = {"event": "TEST"}
        await manager.broadcast(message)
        
        # Failed connection should be removed
        assert len(manager.active_connections) == 2
        assert mock_ws2 not in manager.active_connections

    @pytest.mark.asyncio
    async def test_get_connection_count(self):
        """Test that get_connection_count() returns correct number."""
        manager = ConnectionManager()
        
        assert await manager.get_connection_count() == 0
        
        await manager.connect(AsyncMock())
        assert await manager.get_connection_count() == 1
        
        await manager.connect(AsyncMock())
        assert await manager.get_connection_count() == 2


class TestKitchenOrderSchema:
    """Test KitchenOrderResponse schema validation."""

    def test_kitchen_order_item_schema(self):
        """Test KitchenOrderItem schema."""
        from app.schemas.kitchen import KitchenOrderItem
        
        item = KitchenOrderItem(
            id=1,
            nombre_snapshot="Margherita",
            cantidad=2,
            precio_snapshot=Decimal("12.50")
        )
        
        assert item.id == 1
        assert item.nombre_snapshot == "Margherita"
        assert item.cantidad == 2
        assert item.precio_snapshot == Decimal("12.50")

    def test_kitchen_order_response_schema(self):
        """Test KitchenOrderResponse schema."""
        from app.schemas.kitchen import KitchenOrderResponse, KitchenOrderItem
        
        now = datetime.utcnow()
        item = KitchenOrderItem(
            id=1,
            nombre_snapshot="Pepperoni",
            cantidad=1,
            precio_snapshot=Decimal("14.50")
        )
        
        order = KitchenOrderResponse(
            id=100,
            estado_codigo="CONFIRMADO",
            notas="Sin cebolla",
            items=[item],
            kitchen_entry_at=now
        )
        
        assert order.id == 100
        assert order.estado_codigo == "CONFIRMADO"
        assert order.notas == "Sin cebolla"
        assert len(order.items) == 1
        assert order.kitchen_entry_at == now

    def test_kitchen_order_list_response_schema(self):
        """Test KitchenOrderListResponse schema."""
        from app.schemas.kitchen import KitchenOrderListResponse, KitchenOrderResponse, KitchenOrderItem
        
        items_list = [
            KitchenOrderResponse(
                id=1,
                estado_codigo="CONFIRMADO",
                notas="",
                items=[],
                kitchen_entry_at=datetime.utcnow()
            )
        ]
        
        response = KitchenOrderListResponse(items=items_list, total=1)
        
        assert response.total == 1
        assert len(response.items) == 1


class TestKDSWorkflow:
    """Integration tests for complete KDS workflow."""

    @pytest.mark.asyncio
    async def test_complete_kds_workflow(
        self,
        db_session: AsyncSession,
        async_client: AsyncClient,
    ):
        """Test complete workflow: order creation → kitchen view → WebSocket broadcast."""
        # 1. Create kitchen user with COCINA role
        cocina_role = Role(codigo="COCINA", nombre="Kitchen Staff", descripcion="Kitchen staff")
        db_session.add(cocina_role)
        
        kitchen_user = User(
            email="chef@foodstore.com",
            hashed_password=get_password_hash("ChefPass123"),
            is_active=True,
            role="COCINA"
        )
        db_session.add(kitchen_user)
        await db_session.flush()
        
        user_role = UsuarioRol(usuario_id=kitchen_user.id, rol_codigo="COCINA")
        db_session.add(user_role)
        
        # 2. Create product for order
        category = Category(name="Pastas", description="Italian pastas")
        db_session.add(category)
        await db_session.flush()
        
        product = Product(
            name="Carbonara",
            description="Classic carbonara",
            price=Decimal("13.50"),
            category_id=category.id,
            is_available=True
        )
        db_session.add(product)
        await db_session.flush()
        
        Inventory(product_id=product.id, stock_quantity=50)
        
        # 3. Create order in CONFIRMADO state
        confirmado = EstadoPedido(
            codigo="CONFIRMADO",
            descripcion="Confirmed",
            es_terminal=False,
            created_at=datetime.utcnow()
        )
        db_session.add(confirmado)
        await db_session.flush()
        
        order = Order(
            user_id=kitchen_user.id,
            estado_codigo="CONFIRMADO",
            total_amount=Decimal("13.50"),
            status="confirmado",
            notas="Al dente"
        )
        db_session.add(order)
        await db_session.flush()
        
        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=1,
            unit_price=Decimal("13.50"),
            nombre_snapshot="Carbonara",
            precio_snapshot=Decimal("13.50")
        )
        db_session.add(item)
        
        hist = HistorialEstadoPedido(
            pedido_id=order.id,
            estado_desde="PENDIENTE",
            estado_hasta="CONFIRMADO",
            created_at=datetime.utcnow()
        )
        db_session.add(hist)
        
        await db_session.commit()
        
        # 4. Fetch from KDS endpoint
        token = create_access_token(data={"user_id": kitchen_user.id})
        response = await async_client.get(
            "/api/v1/cocina/pedidos",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["estado_codigo"] == "CONFIRMADO"
        assert data["items"][0]["notas"] == "Al dente"
        assert len(data["items"][0]["items"]) == 1
        assert data["items"][0]["items"][0]["nombre_snapshot"] == "Carbonara"


class TestFSMKitchenTransitions:
    """Test FSM transition rules for COCINA role (RN-CO03).
    
    RN-CO03: Kitchen staff can only:
    - CONFIRMADO → EN_PREP (start preparing)
    - EN_PREP → EN_CAMINO (dispatch order)
    """

    @pytest.mark.asyncio
    async def test_cocina_confirmado_to_en_prep(
        self, db_session: AsyncSession, test_orders_in_kitchen: tuple[Order, Order, Order]
    ):
        """Test COCINA can transition CONFIRMADO → EN_PREP."""
        order1, _, _ = test_orders_in_kitchen
        assert order1.estado_codigo == "CONFIRMADO"

        # Get a user_id from the order
        await fsm_transition(
            order1, "EN_PREP", order1.user_id, db_session,
            usuario_rol="COCINA",
        )

        assert order1.estado_codigo == "EN_PREP"

    @pytest.mark.asyncio
    async def test_cocina_en_prep_to_en_camino(
        self, db_session: AsyncSession, test_orders_in_kitchen: tuple[Order, Order, Order]
    ):
        """Test COCINA can transition EN_PREP → EN_CAMINO."""
        _, _, order3 = test_orders_in_kitchen
        assert order3.estado_codigo == "EN_PREP"

        await fsm_transition(
            order3, "EN_CAMINO", order3.user_id, db_session,
            usuario_rol="COCINA",
        )

        assert order3.estado_codigo == "EN_CAMINO"

    @pytest.mark.asyncio
    async def test_cocina_cannot_skip_states(
        self, db_session: AsyncSession, test_orders_in_kitchen: tuple[Order, Order, Order]
    ):
        """Test COCINA cannot do CONFIRMADO → EN_CAMINO (skip EN_PREP)."""
        order1, _, _ = test_orders_in_kitchen
        assert order1.estado_codigo == "CONFIRMADO"

        with pytest.raises(HTTPException) as exc_info:
            await fsm_transition(
                order1, "EN_CAMINO", order1.user_id, db_session,
                usuario_rol="COCINA",
            )

        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_cocina_cannot_transition_from_terminal(
        self, db_session: AsyncSession, kitchen_user: User
    ):
        """Test COCINA cannot transition from a non-kitchen state."""
        # Create order in a non-kitchen state (PENDIENTE)
        pendiente = EstadoPedido(
            codigo="PENDIENTE",
            descripcion="Order pending",
            es_terminal=False,
            created_at=datetime.utcnow()
        )
        db_session.add(pendiente)
        await db_session.flush()

        order = Order(
            user_id=kitchen_user.id,
            estado_codigo="PENDIENTE",
            total_amount=Decimal("10.00"),
            status="pendiente"
        )
        db_session.add(order)
        await db_session.commit()
        await db_session.refresh(order)

        # COCINA trying to transition from PENDIENTE should fail
        # (only kitchen states are CONFIRMADO → EN_PREP and EN_PREP → EN_CAMINO)
        with pytest.raises(HTTPException) as exc_info:
            await fsm_transition(
                order, "CONFIRMADO", kitchen_user.id, db_session,
                usuario_rol="COCINA",
            )

        assert exc_info.value.status_code == 403


class TestBroadcastEvents:
    """Test that FSM transitions emit correct broadcast events (RN-CO05, RN-CO06)."""

    @pytest.mark.asyncio
    async def test_broadcast_on_confirmado_to_en_prep(
        self, db_session: AsyncSession, test_orders_in_kitchen: tuple[Order, Order, Order]
    ):
        """Test CONFIRMADO → EN_PREP emits PEDIDO_EN_PREPARACION."""
        order1, _, _ = test_orders_in_kitchen
        mock_manager = AsyncMock(spec=ConnectionManager)

        await fsm_transition(
            order1, "EN_PREP", order1.user_id, db_session,
            usuario_rol="COCINA",
            websocket_manager=mock_manager,
        )

        mock_manager.broadcast.assert_called_once()
        call_args = mock_manager.broadcast.call_args[0][0]
        assert call_args["event"] == "PEDIDO_EN_PREPARACION"
        assert call_args["order_id"] == order1.id
        assert call_args["estado_codigo"] == "EN_PREP"

    @pytest.mark.asyncio
    async def test_broadcast_on_en_prep_to_en_camino(
        self, db_session: AsyncSession, test_orders_in_kitchen: tuple[Order, Order, Order]
    ):
        """Test EN_PREP → EN_CAMINO emits PEDIDO_EN_CAMINO."""
        _, _, order3 = test_orders_in_kitchen
        mock_manager = AsyncMock(spec=ConnectionManager)

        await fsm_transition(
            order3, "EN_CAMINO", order3.user_id, db_session,
            usuario_rol="COCINA",
            websocket_manager=mock_manager,
        )

        mock_manager.broadcast.assert_called_once()
        call_args = mock_manager.broadcast.call_args[0][0]
        assert call_args["event"] == "PEDIDO_EN_CAMINO"
        assert call_args["order_id"] == order3.id
        assert call_args["estado_codigo"] == "EN_CAMINO"

    @pytest.mark.asyncio
    async def test_no_broadcast_without_manager(
        self, db_session: AsyncSession, test_orders_in_kitchen: tuple[Order, Order, Order]
    ):
        """Test no broadcast when websocket_manager is None (backward compat)."""
        order1, _, _ = test_orders_in_kitchen

        # Should not raise even without websocket_manager
        await fsm_transition(
            order1, "EN_PREP", order1.user_id, db_session,
            usuario_rol="COCINA",
            websocket_manager=None,
        )

        assert order1.estado_codigo == "EN_PREP"

    @pytest.mark.asyncio
    async def test_broadcast_on_cancel(
        self, db_session: AsyncSession, test_orders_in_kitchen: tuple[Order, Order, Order]
    ):
        """Test cancel from CONFIRMADO emits PEDIDO_CANCELADO."""
        order1, _, _ = test_orders_in_kitchen
        mock_manager = AsyncMock(spec=ConnectionManager)

        # Cancel needs a user with role other than COCINA (or admin-like)
        await fsm_transition(
            order1, "CANCELADO", order1.user_id, db_session,
            websocket_manager=mock_manager,
        )

        mock_manager.broadcast.assert_called_once()
        call_args = mock_manager.broadcast.call_args[0][0]
        assert call_args["event"] == "PEDIDO_CANCELADO"
        assert call_args["order_id"] == order1.id
