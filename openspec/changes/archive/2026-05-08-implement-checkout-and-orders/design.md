## Context

The shopping cart is fully implemented with items CRUD, and the checkout endpoint exists but returns `order_id: None`. The `Order` and `OrderItem` models already exist in the database schema (migration `1c78cfd1cfce`), but they lack ORM relationships and there are no routes, schemas, or business logic for order management. The inventory system has a reservation mechanism but no release endpoint for cancellations.

## Goals / Non-Goals

**Goals:**
- Wire the cart checkout to create real Order + OrderItem records in a single transaction
- Reserve inventory at checkout time
- Provide order management endpoints: list user orders, get order details, cancel order
- Provide admin endpoint to update order status (confirmed → shipped → delivered)
- Release reserved inventory when an order is cancelled
- Track status changes with timestamps

**Non-Goals:**
- Payment processing (future change)
- Order returns/refunds
- Email notifications (future change)
- Shipping address management (future change)
- Admin order search/filtering beyond status

## Decisions

### 1. Order creation in cart_service, not order_service
**Decision**: `checkout_cart()` in `cart_service.py` will call a new `create_order_from_cart()` function in `order_service.py`.
**Rationale**: The checkout flow is the cart's responsibility (it transitions cart to `checked_out`). Delegating order creation to the order service keeps the cart service focused on cart concerns while preventing circular dependencies.
**Alternative considered**: Putting everything in cart_service. Rejected because order creation logic (reservation, validation) belongs in order domain.

### 2. Inventory reservation in the checkout transaction
**Decision**: Reserve inventory inside the same database transaction as order creation, using SQLAlchemy's `AsyncSession` transaction scope.
**Rationale**: Prevents race conditions where stock is reserved but order creation fails, or vice versa. Atomicity is critical for e-commerce.
**Alternative considered**: Two-phase commit with a reservation timeout. Rejected as over-engineering for v1 — single transaction with rollback on failure is sufficient.

### 3. Status history as JSON column
**Decision**: Add a `status_history` JSON column to `orders` table storing `[{status, timestamp, by}]` for audit trail.
**Rationale**: Simple, queryable, and avoids a separate `order_status_log` table. JSON columns in PostgreSQL support indexing if needed later. The creation migration already exists; this requires a new alembic migration to add the column.
**Alternative considered**: Separate `order_status_log` table. Rejected for v1 to keep complexity low; can migrate later if query patterns demand it.

### 4. Cancel release endpoint, not separate service
**Decision**: `order_service.cancel_order()` will directly decrement `inventory.reserved_quantity` for each order item, rather than calling an external inventory service.
**Rationale**: Avoids circular service dependencies. The order service has authority over cancellation and directly manages the associated inventory release.
**Alternative considered**: HTTP call to `/inventory/{id}/release`. Rejected because services should coordinate via function calls, not HTTP, within the same process.

### 5. Soft delete / no hard deletes
**Decision**: Orders are never deleted. They transition to `cancelled` status. This preserves purchase history integrity.
**Rationale**: E-commerce domain requires immutable order records for accounting and audit.

### 6. Alembic migration, not auto-create
**Decision**: New migration for `status_history` column using `alembic revision --autogenerate`.
**Rationale**: The existing migration already creates orders/order_items tables. We only need to add the column. Auto-generate detects the model change.

## Migration Plan

1. Add `status_history` to `Order` model
2. Run `alembic revision --autogenerate -m "add order status history"` and review
3. Apply migration
4. Deploy new schemas → service → routes in that order
5. Existing `checked_out` carts without orders (if any) will require a manual reconciliation step

## Risks / Trade-offs

- **[Risk]** Concurrent checkout of same product could oversell → **Mitigation**: Single-transaction reservation + `select ... for update` on inventory rows within the transaction
- **[Risk]** Large carts create many order items → **Mitigation**: Acceptable for v1; bulk insert optimization deferred
- **[Risk]** No payment validation yet → **Mitigation**: The system creates orders in `PENDING` status; they are not fulfilled until payment is confirmed (future change)
