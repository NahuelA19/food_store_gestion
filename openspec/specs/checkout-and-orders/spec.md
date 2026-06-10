## MODIFIED Requirements

### Requirement: Order status includes payment states
The order SHALL support payment-related statuses in addition to fulfillment statuses. The FSM for EN_PREP SHALL now support three possible transitions: LISTO, EN_CAMINO, or CANCELADO.

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

### Requirement: Order status transitions respect role permissions
The system SHALL validate user role when processing status transitions. Users with role `admin` or `chef` SHALL use `_CHEF_ALLOWED_STATES` (EN_PREP, LISTO). Users with role `admin` or `cocina` SHALL use `_COCINA_ALLOWED_STATES` (EN_PREP, EN_CAMINO).

#### Scenario: Chef transitions EN_PREP to LISTO
- **WHEN** a user with role `chef` sends `PATCH /api/v1/orders/{id}/status` with body `{"status": "LISTO"}` and current estado is EN_PREP
- **THEN** the transition SHALL succeed

#### Scenario: COCINA transitions EN_PREP to EN_CAMINO
- **WHEN** a user with role `cocina` sends `PATCH /api/v1/orders/{id}/status` with body `{"status": "EN_CAMINO"}` and current estado is EN_PREP
- **THEN** the transition SHALL succeed

#### Scenario: Chef cannot transition to EN_CAMINO
- **WHEN** a user with role `chef` sends `PATCH /api/v1/orders/{id}/status` with body `{"status": "EN_CAMINO"}`
- **THEN** the system SHALL return an error (invalid role for this transition)

#### Scenario: COCINA cannot transition to LISTO
- **WHEN** a user with role `cocina` sends `PATCH /api/v1/orders/{id}/status` with body `{"status": "LISTO"}`
- **THEN** the system SHALL return an error (invalid role for this transition)

### Requirement: Checkout response includes client_secret
The checkout endpoint SHALL return a `client_secret` for frontend payment confirmation via Stripe.js.

#### Scenario: Checkout returns client_secret
- **WHEN** user calls POST `/api/carts/{cart_id}/checkout`
- **THEN** response includes `client_secret` field with the Stripe PaymentIntent client secret

### Requirement: Pay-cash endpoint allows COCINA role
The `POST /api/v1/orders/{id}/pay-cash` endpoint SHALL accept users with role `admin`, `cajero`, or `cocina`.

#### Scenario: COCINA confirms cash payment
- **WHEN** a user with role `cocina` sends `POST /api/v1/orders/1/pay-cash` and order is PENDIENTE
- **THEN** the order SHALL transition to CONFIRMADO
- **AND** the broadcast event SHALL be emitted to KDS clients
