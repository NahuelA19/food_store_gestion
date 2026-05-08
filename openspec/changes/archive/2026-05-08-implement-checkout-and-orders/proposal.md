## Why

The shopping cart exists but users cannot complete purchases. The checkout endpoint returns `order_id: null` as a placeholder. This change completes the purchase flow by wiring the cart checkout to real Order creation, inventory reservation, and order lifecycle management.

## What Changes

- **Cart checkout** (`POST /api/carts/{cart_id}/checkout`): Replace `order_id: None` stub with real `Order` + `OrderItem` creation and inventory reservation
- **New order management routes**: List user orders, get order details, cancel order (user), update order status (admin)
- **New order service**: Business logic for order creation, retrieval, status transitions, and cancellation
- **New order schemas**: Pydantic v2 models for request/response serialization
- **Model relationship updates**: Add ORM relationships between `Order ↔ User`, `Order ↔ OrderItem`, `OrderItem ↔ Product`
- **Inventory release on cancellation**: New endpoint/method to release reserved stock when an order is cancelled
- **Alembic migration**: Add `status_history` JSON column to `orders` table for tracking status changes over time

## Capabilities

### New Capabilities
- `checkout-and-orders`: Order lifecycle management — creating orders from cart checkout, listing user orders, viewing order details, cancelling orders, and admin status transitions with inventory reservation

### Modified Capabilities
- *(none — existing specs don't cover order behavior)*

## Impact

- **Backend routes**: New `backend/app/routes/orders.py`, update `backend/app/routes/cart.py` (checkout wiring)
- **Backend schemas**: New `backend/app/schemas/order.py`, update `backend/app/schemas/__init__.py`
- **Backend services**: New `backend/app/services/order_service.py`, update `backend/app/services/cart_service.py`
- **Backend models**: Update `backend/app/models/order.py`, `backend/app/models/order_item.py`, `backend/app/models/user.py` (relationships)
- **Backend main.py**: Register new orders router
- **Database**: New alembic migration for `status_history` column
- **Tests**: New `backend/tests/test_orders.py` and `backend/tests/test_order_endpoint.py`
