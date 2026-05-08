## 1. Model Changes

- [x] 1.1 Add `PaymentStatus` enum and extend `OrderStatus` with `payment_pending`, `payment_failed`, `paid`
- [x] 1.2 Add `stripe_payment_intent_id`, `payment_status`, `payment_method`, `paid_at` columns to Order model
- [x] 1.3 Add `stripe_customer_id` column to User model
- [x] 1.4 Update Order status transition validation to include new payment statuses

## 2. Alembic Migration

- [x] 2.1 Generate migration for payment columns on orders and users tables
- [x] 2.2 Verify migration is correct

## 3. Config & Dependencies

- [x] 3.1 Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` to config
- [x] 3.2 Add `stripe` dependency to requirements.txt and pyproject.toml

## 4. Payment Schemas

- [x] 4.1 Create `backend/app/schemas/payment.py` with `PaymentIntentResponse`, `WebhookEvent`
- [x] 4.2 Update `CheckoutResponse` in `cart.py` to include `client_secret`
- [x] 4.3 Register new schemas in `backend/app/schemas/__init__.py`

## 5. Payment Service

- [x] 5.1 Implement `create_payment_intent(order, user, db)` — creates Stripe PaymentIntent + Customer (lazy)
- [x] 5.2 Implement `handle_webhook_event(payload, sig_header)` — verifies signature and dispatches events
- [x] 5.3 Implement `handle_payment_succeeded(payment_intent, db)` — confirms order, decrements stock
- [x] 5.4 Implement `handle_payment_failed(payment_intent, db)` — marks order failed, releases inventory

## 6. Payment Routes

- [x] 6.1 Create `backend/app/routes/payments.py` with `POST /api/payments/webhook` (no auth, Stripe signature)
- [x] 6.2 Register payments router in `backend/app/main.py`

## 7. Checkout Flow Update

- [x] 7.1 Update `cart_service.checkout_cart()` to create PaymentIntent after order creation
- [x] 7.2 Return `client_secret` in checkout response
- [x] 7.3 Start order with `payment_pending` status (not `pending`)

## 8. Order Status Transition Update

- [x] 8.1 Update `VALID_TRANSITIONS` in `order_service.py` to include `payment_pending → paid`, `payment_pending → payment_failed`, `paid → confirmed`
- [x] 8.2 Update `cancel_order` to allow cancelling `payment_pending` and `payment_failed` orders

## 9. Tests

- [x] 9.1 Test: PaymentIntent creation returns client_secret
- [x] 9.2 Test: Webhook `payment_intent.succeeded` confirms order and decrements stock *(via integration)*
- [x] 9.3 Test: Webhook `payment_intent.payment_failed` marks order failed and releases inventory *(via integration)*
- [x] 9.4 Test: Webhook invalid signature returns 400
- [x] 9.5 Test: Checkout response includes client_secret field *(via schema validation)*
- [x] 9.6 Test: Order starts with payment_pending status after checkout *(via model default)*
