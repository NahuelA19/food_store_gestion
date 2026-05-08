## Context

Orders exist with status `pending` and inventory is reserved at checkout time — but no payment is collected. The frontend needs a `client_secret` from Stripe to confirm payment, and the backend needs a webhook to react to payment outcomes. Stripe is the chosen payment gateway for v1.

## Goals / Non-Goals

**Goals:**
- Integrate Stripe PaymentIntents API for secure payment collection
- Create PaymentIntent at checkout time (after order creation)
- Return `client_secret` in checkout response for frontend confirmation
- Handle Stripe webhooks: `payment_intent.succeeded` → confirm order + decrement stock; `payment_intent.payment_failed` → mark order failed + release inventory
- Add payment tracking fields to Order and User models
- Support Stripe test mode for development

**Non-Goals:**
- Saved payment methods / customer wallets (future)
- Refunds / partial refunds (future)
- Multiple payment gateways (v1 is Stripe-only)
- PCI compliance scope (Stripe Elements handles card data — we never touch raw card numbers)

## Decisions

### 1. PaymentIntent creation at checkout, not before
**Decision**: Create the Stripe PaymentIntent inside `checkout_cart()` after `create_order_from_cart()` succeeds, but before marking the cart as `checked_out`.
**Rationale**: The PaymentIntent needs the final total from the Order. Creating it inside the same transaction ensures order and payment intent are linked atomically.
**Flow**: Cart validation → Create Order → Create Stripe PaymentIntent → Mark cart checked_out → Return `client_secret` + `order_id`

### 2. Two-phase order status: payment_pending → paid (or payment_failed)
**Decision**: Orders start as `payment_pending` (not `pending` as before). Webhook transitions to `paid` or `payment_failed`.
**Rationale**: The old flow set orders to `pending` immediately, but no payment was collected. Now `pending` means "admin confirmed payment" (for manual review). The new default is `payment_pending`.
**Transition map**: `payment_pending` → `paid` (on success) or `payment_failed` (on failure). `paid` → (admin) `confirmed` → `shipped` → `delivered`.

### 3. Webhook uses Stripe signature verification
**Decision**: The `POST /api/payments/webhook` endpoint uses `stripe.Webhook.construct_event()` to verify the signature.
**Rationale**: Stripe webhooks are publicly accessible URLs. Without signature verification, anyone could send fake payment events. The `STRIPE_WEBHOOK_SECRET` config stores the signing secret.
**No auth on webhook**: The endpoint is unauthenticated (no JWT) — Stripe signature IS the auth.

### 4. Inventory: reserved on order, decremented on payment
**Decision**: `stock_quantity` decremented only when payment succeeds (webhook). `reserved_quantity` cleared at same time.
**Rationale**: Prevents selling the same stock twice during the payment window. Items remain "reserved" while user is on the payment page. If payment fails, reserved stock is released back.
**On `payment_intent.succeeded`**: `reserved_quantity -= qty` AND `stock_quantity -= qty`
**On `payment_intent.payment_failed`**: `reserved_quantity -= qty` (release only, don't decrement stock)

### 5. Stripe customer creation is lazy
**Decision**: Create Stripe Customer on first checkout if the user doesn't have a `stripe_customer_id` yet.
**Rationale**: Deferred setup — no need to create Stripe customers at user registration. Only created when the user actually checks out.
**Alternative considered**: Create Stripe Customer at user registration. Rejected to avoid orphaned Stripe customers for users who never purchase.

## Architecture

```
Frontend                          Backend                          Stripe
───────                          ───────                          ──────
  │                                │                                │
  │  POST /api/carts/{id}/checkout │                                │
  │ ──────────────────────────────>│                                │
  │                                │  Create Order + Reserve        │
  │                                │  Create PaymentIntent ────────>│
  │  { order_id, client_secret }   │  <──── PaymentIntent ----------│
  │ <──────────────────────────────│                                │
  │                                │                                │
  │  stripe.confirmCardPayment()   │                                │
  │ ────────────────────────────────────────────────────────────>   │
  │  (Stripe.js handles this)      │                                │
  │                                │                                │
  │                                │  POST /api/payments/webhook    │
  │                                │ <──── payment_intent.succeeded │
  │                                │  Confirm order, decrement stock│
  │                                │                                │
```

## Risks / Trade-offs

- **[Risk]** Webhook delivery delayed or missed → **Mitigation**: Stripe automatically retries for up to 3 days. Add a reconciliation job (future) for orders stuck in `payment_pending`.
- **[Risk]** User closes browser before payment confirms → **Mitigation**: The PaymentIntent remains valid. Webhook still fires when/if Stripe confirms. The frontend can poll order status via `GET /api/orders/{id}`.
- **[Risk]** Stripe test vs production keys misconfiguration → **Mitigation**: All Stripe operations go through abstraction layer in `payment_service.py`. Only the config changes between environments.
- **[Trade-off]** Stripe webhooks require exposing a public URL → Development can use Stripe CLI (`stripe listen --forward-to localhost:8000/api/payments/webhook`) or ngrok.

## Open Questions

- Should we implement `payment_intent.canceled` handler? (User cancels payment on Stripe Checkout page)
