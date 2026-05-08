## 1. Model Relationships

- [x] 1.1 Add `user` relationship (back_populates="orders") to Order model
- [x] 1.2 Add `items` relationship (back_populates="order", cascade="all, delete-orphan") to Order model
- [x] 1.3 Add `order` and `product` relationships to OrderItem model
- [x] 1.4 Add `orders` relationship (back_populates="orders") to User model
- [x] 1.5 Add `status_history` JSON column to Order model

## 2. Alembic Migration

- [x] 2.1 Generate migration for `status_history` column on `orders` table
- [x] 2.2 Review and verify migration is correct

## 3. Order Schemas (Pydantic v2)

- [x] 3.1 Create `backend/app/schemas/order.py` with: OrderResponse, OrderDetailResponse, OrderListResponse, OrderStatusUpdate
- [x] 3.2 Register order schemas in `backend/app/schemas/__init__.py`

## 4. Order Service

- [x] 4.1 Implement `create_order_from_cart(cart, body, db)` — creates Order + OrderItems in transaction
- [x] 4.2 Implement `get_user_orders(user_id, page, limit, db)` — paginated order list
- [x] 4.3 Implement `get_order_detail(order_id, user_id, db)` — single order with items
- [x] 4.4 Implement `cancel_order(order_id, user_id, db)` — status change + inventory release
- [x] 4.5 Implement `update_order_status(order_id, new_status, admin_id, db)` — status transition with validation
- [x] 4.6 Implement inventory release helper `release_inventory(order, db)` used by cancel_order

## 5. Order Routes

- [x] 5.1 Create `backend/app/routes/orders.py` with:
  - `GET /api/orders/` — list user orders
  - `GET /api/orders/{order_id}` — order detail
  - `POST /api/orders/{order_id}/cancel` — cancel pending order
  - `PATCH /api/orders/{order_id}/status` — admin status update
- [x] 5.2 Register orders router in `backend/app/main.py`

## 6. Cart Checkout Wiring

- [x] 6.1 Update `cart_service.checkout_cart()` to call `order_service.create_order_from_cart()`
- [x] 6.2 Return real `order_id` in checkout response
- [x] 6.3 Verify checkout handles inventory reservation

## 7. Tests

- [x] 7.1 Test: successful checkout creates order with correct items
- [x] 7.2 Test: checkout fails for empty cart
- [x] 7.3 Test: checkout fails for already checked-out cart
- [ ] 7.4 Test: checkout fails when price changed >10% *(needs DB to verify)*
- [ ] 7.5 Test: checkout fails when insufficient stock *(needs DB + inventory setup)*
- [x] 7.6 Test: user can list their orders (paginated)
- [x] 7.7 Test: user can view order detail with items
- [x] 7.8 Test: non-owner gets 404 on order detail
- [x] 7.9 Test: user can cancel pending order
- [x] 7.10 Test: cannot cancel non-pending order
- [ ] 7.11 Test: admin can update order status through valid transitions *(needs admin user + DB)*
- [ ] 7.12 Test: invalid status transitions are rejected *(needs DB)*
- [ ] 7.13 Test: cancellation releases reserved inventory *(needs DB + inventory setup)*
- [ ] 7.14 Test: status_history tracks each transition *(needs DB)*
