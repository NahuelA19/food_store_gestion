## MODIFIED Requirements

### Requirement: Order status includes payment states
The order SHALL support payment-related statuses in addition to fulfillment statuses.

#### Scenario: Order starts in payment_pending
- **WHEN** checkout creates an order
- **THEN** order status is `payment_pending` (not `pending`)

#### Scenario: Payment success transitions to paid
- **WHEN** Stripe webhook receives `payment_intent.succeeded`
- **THEN** order status changes from `payment_pending` to `paid`

#### Scenario: Payment failure transitions to payment_failed
- **WHEN** Stripe webhook receives `payment_intent.payment_failed`
- **THEN** order status changes from `payment_pending` to `payment_failed`

#### Scenario: Admin confirms paid order
- **WHEN** admin calls `PATCH /api/orders/{id}/status` with status `confirmed`
- **THEN** order transitions from `paid` to `confirmed`

### Requirement: Checkout response includes client_secret
The checkout endpoint SHALL return a `client_secret` for frontend payment confirmation via Stripe.js.

#### Scenario: Checkout returns client_secret
- **WHEN** user calls POST `/api/carts/{cart_id}/checkout`
- **THEN** response includes `client_secret` field with the Stripe PaymentIntent client secret
