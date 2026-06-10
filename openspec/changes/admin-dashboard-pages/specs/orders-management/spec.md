## ADDED Requirements

### Requirement: Orders list page with status filtering
The system SHALL provide an orders management page displaying all orders in a table with columns: order ID, customer, status, total, date, branch. The page SHALL support filtering by status (pending, confirmed, preparing, ready, delivered, cancelled).

#### Scenario: Orders list renders with data
- **WHEN** navigating to /orders
- **THEN** the system SHALL display a table of orders with ID, customer name, status badge, total, date, and branch

#### Scenario: Filter by status shows matching orders
- **WHEN** clicking a status filter (e.g., "Pending")
- **THEN** the table SHALL show only orders with that status

#### Scenario: Loading state shows skeleton
- **WHEN** order data is loading
- **THEN** the table SHALL display Skeleton rows with shimmer animation

#### Scenario: Empty state shows icon and message
- **WHEN** no orders match the current filter
- **THEN** the page SHALL display an empty state with lucide icon and "No se encontraron pedidos" message

### Requirement: Order detail page
The system SHALL provide an order detail page showing full order information: customer details, items ordered, quantities, prices, status timeline, and branch info.

#### Scenario: Order detail shows all information
- **WHEN** navigating to /orders/:id
- **THEN** the system SHALL display order header (ID, status badge, date), customer section (name, email, phone), items table (product, quantity, unit price, subtotal), and order summary (subtotal, shipping, tax, total)

#### Scenario: Status update action
- **WHEN** clicking the status dropdown on order detail
- **THEN** the system SHALL show available next statuses and update the badge when selected

### Requirement: Order status management
The system SHALL allow changing order status through a dropdown on the order detail page. Available statuses: pending, confirmed, preparing, ready, delivered, cancelled.

#### Scenario: Status changes show confirmation
- **WHEN** changing order status from "pending" to "confirmed"
- **THEN** the system SHALL update the status badge immediately and show a success toast
