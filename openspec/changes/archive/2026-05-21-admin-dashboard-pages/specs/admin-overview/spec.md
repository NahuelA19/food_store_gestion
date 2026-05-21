## ADDED Requirements

### Requirement: Admin dashboard with KPI metrics
The system SHALL display an admin dashboard home page showing key performance indicators for restaurant management: total orders (today/week/month), revenue, active branches, pending orders, and products count.

#### Scenario: Dashboard shows KPI cards
- **WHEN** rendering the admin dashboard
- **THEN** it SHALL display a row of stat cards showing each KPI with an SVG icon, numeric value, and trend indicator

#### Scenario: KPI cards have loading skeleton
- **WHEN** data is loading
- **THEN** each KPI card SHALL display a Skeleton placeholder with shimmer animation

### Requirement: Dashboard quick actions
The system SHALL provide quick action buttons on the dashboard for common tasks: new product, view orders, manage branches.

#### Scenario: Quick action navigates to management page
- **WHEN** clicking a quick action (e.g., "New Product")
- **THEN** the system SHALL navigate to the corresponding management page

### Requirement: Dashboard shows pending orders summary
The system SHALL display a compact list of recent/pending orders on the dashboard with order ID, customer, status, and total.

#### Scenario: Pending orders list renders
- **WHEN** there are pending orders
- **THEN** the dashboard SHALL show a table with order ID (linked to detail), customer name, status badge, and total amount

### Requirement: Dashboard shows branch overview
The system SHALL display a summary of all branches with their current status (active/inactive) and key metrics per branch.

#### Scenario: Branch summary renders
- **WHEN** rendering the dashboard
- **THEN** it SHALL show branch cards with name, address, status badge, and order count
