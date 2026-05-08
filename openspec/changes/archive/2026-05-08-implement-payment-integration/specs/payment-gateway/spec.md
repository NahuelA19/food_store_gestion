## ADDED Requirements

### Requirement: Stripe PaymentIntent created at checkout
The system SHALL create a Stripe PaymentIntent when a user checks out, using the order total as the amount.

#### Scenario: PaymentIntent created with correct amount
- **WHEN** user checks out an order with total $66.00
- **THEN** a Stripe PaymentIntent is created for 6600 (amount in cents)
- **AND** the PaymentIntent ID is stored on the Order as `stripe_payment_intent_id`

### Requirement: Webhook processes payment success
The system SHALL expose a `POST /api/payments/webhook` endpoint that Stripe sends events to.

#### Scenario: Successful payment confirms order
- **WHEN** Stripe sends `payment_intent.succeeded` event
- **THEN** webhook verifies Stripe signature
- **AND** updates order status to `paid`
- **AND** decrements inventory (`stock_quantity -= qty`, `reserved_quantity -= qty`)
- **AND** returns 200 status to Stripe

#### Scenario: Failed payment releases inventory
- **WHEN** Stripe sends `payment_intent.payment_failed` event
- **THEN** webhook verifies Stripe signature
- **AND** updates order status to `payment_failed`
- **AND** releases reserved inventory (`reserved_quantity -= qty`, stock unchanged)
- **AND** returns 200 status to Stripe

#### Scenario: Invalid webhook signature rejected
- **WHEN** request to webhook endpoint has invalid or missing Stripe signature
- **THEN** endpoint returns 400 error

### Requirement: Payment fields on Order model
The Order SHALL store payment-related information for tracking.

#### Scenario: Order stores payment intent ID
- **WHEN** PaymentIntent is created during checkout
- **THEN** Order stores `stripe_payment_intent_id`

#### Scenario: Order records payment timestamp
- **WHEN** payment succeeds via webhook
- **THEN** Order records `paid_at` timestamp

### Requirement: Config stores Stripe keys
The system SHALL load Stripe configuration from environment variables.

#### Scenario: Stripe config loaded from env
- **WHEN** application starts
- **THEN** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PUBLISHABLE_KEY` are loaded from environment
