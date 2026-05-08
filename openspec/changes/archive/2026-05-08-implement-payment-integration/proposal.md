## Why

Orders are created with status `pending` but there is no payment flow. The system creates orders and reserves inventory but never collects payment or confirms funds. This change integrates Stripe PaymentIntents so users can pay for their orders, and the system can confirm payment before fulfilling.

## What Changes

- **Order model**: Add `stripe_payment_intent_id`, `payment_status`, `payment_method`, `paid_at` columns
- **OrderStatus enum**: Add `payment_pending`, `payment_failed`, `paid` statuses
- **User model**: Add `stripe_customer_id` column for identifying customers in Stripe
- **Checkout flow (`POST /api/carts/{cart_id}/checkout`)**: After creating the order, create a Stripe PaymentIntent and return `client_secret` to the frontend
- **New payment routes**: `POST /api/payments/webhook` — Stripe webhook handler for `payment_intent.succeeded` and `payment_intent.payment_failed`
- **New payment service**: Wraps Stripe API (create_payment_intent, confirm_payment, handle_webhook)
- **Inventory update**: On `payment_intent.succeeded`, decrement actual `stock_quantity` (not just reserved)
- **New config vars**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`
- **New dependency**: `stripe` Python SDK

## Capabilities

### New Capabilities
- `payment-gateway`: Stripe payment processing — creating PaymentIntents during checkout, handling webhook events (success/failure), managing payment status lifecycle

### Modified Capabilities
- `checkout-and-orders`: Order statuses extended to include `payment_pending`, `payment_failed`, `paid`; checkout response includes `client_secret` for frontend payment confirmation

## Impact

- **Backend models**: Update `Order` (payment fields + new statuses), `User` (`stripe_customer_id`)
- **Backend schemas**: New `backend/app/schemas/payment.py`, update `CheckoutResponse` to include `client_secret`
- **Backend services**: New `backend/app/services/payment_service.py`, update `order_service.py` (payment confirmation logic), update `cart_service.py` (checkout flow)
- **Backend routes**: New `backend/app/routes/payments.py`
- **Backend config**: Add Stripe env vars to `Settings`
- **Backend dependencies**: Add `stripe` to `requirements.txt` and `pyproject.toml`
- **Database**: New alembic migration for payment columns
- **Tests**: New `backend/tests/test_payment.py` for webhook handling and payment flow
