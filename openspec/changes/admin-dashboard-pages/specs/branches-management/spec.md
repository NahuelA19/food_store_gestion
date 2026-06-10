## ADDED Requirements

### Requirement: Branches list page
The system SHALL provide a branches management page displaying all restaurant branches as a grid of cards with each branch's name, address, status, and quick metrics.

#### Scenario: Branches list renders as card grid
- **WHEN** navigating to /branches
- **THEN** the system SHALL display branch cards in a responsive grid, each showing name, address, status badge (active/inactive), today's orders count, and revenue

#### Scenario: Branch card has quick actions
- **WHEN** hovering a branch card
- **THEN** the card SHALL show action buttons for "View Details" and "Toggle Status"

#### Scenario: Loading state shows skeleton grid
- **WHEN** branch data is loading
- **THEN** the page SHALL display a grid of Skeleton cards with shimmer animation

### Requirement: Branch detail page
The system SHALL provide a branch detail page showing full branch information: address, contact details, status, opening hours, staff count, and recent orders.

#### Scenario: Branch detail shows full info
- **WHEN** navigating to /branches/:id
- **THEN** the system SHALL display branch header (name, status badge, address), contact section (phone, email), stats row (staff count, today's orders, revenue), and recent orders table
