## ADDED Requirements

### Requirement: Checkout creates order from cart
The system SHALL create an Order with OrderItems when a user checks out their active cart. The order SHALL capture the unit price at time of checkout for each item.

#### Scenario: Successful checkout creates order
- **WHEN** user has an active cart with items and calls `POST /api/carts/{cart_id}/checkout`
- **THEN** system creates an Order with status `pending` and total_amount matching cart total
- **AND** system creates OrderItem records for each CartItem with product_id, quantity, and unit_price
- **AND** system changes cart status to `checked_out`
- **AND** response includes real `order_id` (not null)

#### Scenario: Checkout fails for empty cart
- **WHEN** user calls checkout with an empty cart
- **THEN** system returns 400 error with message about empty cart

#### Scenario: Checkout fails for already checked-out cart
- **WHEN** user calls checkout on a cart with status `checked_out`
- **THEN** system returns 400 error with appropriate message

#### Scenario: Checkout includes price validation
- **WHEN** product price has changed by more than 10% since added to cart
- **THEN** system rejects checkout with 409 error indicating price change

### Requirement: Inventory reservation on checkout
The system SHALL reserve inventory quantities when an order is created, decrementing available stock.

#### Scenario: Inventory reserved on order creation
- **WHEN** checkout creates an order for a product with quantity N
- **THEN** the product's inventory `reserved_quantity` increases by N

#### Scenario: Checkout fails when insufficient stock
- **WHEN** a cart item quantity exceeds available inventory (`stock_quantity - reserved_quantity`)
- **THEN** checkout fails with 409 error indicating insufficient stock

### Requirement: User can list their orders
The system SHALL allow authenticated users to retrieve their order history.

#### Scenario: List user orders returns paginated results
- **WHEN** authenticated user calls `GET /api/orders/`
- **THEN** system returns paginated list of their orders with most recent first
- **AND** each order includes: id, status, total_amount, created_at

### Requirement: User can view order details
The system SHALL allow authenticated users to view full details of their own orders, including line items.

#### Scenario: View order detail includes items
- **WHEN** authenticated user calls `GET /api/orders/{order_id}`
- **THEN** system returns order with all OrderItems (product name, quantity, unit_price)
- **AND** 404 if order does not belong to the user

### Requirement: User can cancel their own pending order
The system SHALL allow users to cancel their own orders if status is `pending`. Cancellation SHALL release reserved inventory.

#### Scenario: Cancel pending order releases inventory
- **WHEN** authenticated user calls `POST /api/orders/{order_id}/cancel` and order status is `pending`
- **THEN** order status changes to `cancelled`
- **AND** reserved inventory for each order item is released (reserved_quantity decremented)
- **AND** status_history records the cancellation

#### Scenario: Cannot cancel non-pending order
- **WHEN** user attempts to cancel order with status other than `pending`
- **THEN** system returns 400 error with appropriate message

### Requirement: Admin can update order status
The system SHALL allow admin users to transition order status along the flow: `pending → confirmed → shipped → delivered`.

#### Scenario: Admin confirms pending order
- **WHEN** admin user calls `PATCH /api/orders/{order_id}/status` with status `confirmed`
- **THEN** order status changes to `confirmed`
- **AND** status_history records the transition

#### Scenario: Admin ships confirmed order
- **WHEN** admin user calls `PATCH /api/orders/{order_id}/status` with status `shipped`
- **THEN** order status changes to `shipped`

#### Scenario: Invalid status transition rejected
- **WHEN** admin attempts to transition from `pending` to `delivered` (skipping `confirmed` and `shipped`)
- **THEN** system returns 400 error with invalid transition message

### Requirement: Order has status history
The system SHALL track order status changes with timestamps.

#### Scenario: Status history recorded on each change
- **WHEN** order status transitions from `pending` to `confirmed`
- **THEN** the `status_history` JSON column records `[{"from": "pending", "to": "confirmed", "timestamp": "...", "by": "user_id"}]`

### Requirement: Only order owner can view/cancel
The system SHALL enforce that users can only view and cancel their own orders.

#### Scenario: Non-owner cannot view order
- **WHEN** user A calls `GET /api/orders/{order_id}` for user B's order
- **THEN** system returns 404 (not 403, to avoid information leakage)
