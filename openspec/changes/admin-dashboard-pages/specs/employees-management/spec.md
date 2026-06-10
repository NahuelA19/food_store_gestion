## ADDED Requirements

### Requirement: Employees list page
The system SHALL provide an employees management page displaying all team members in a table with columns: name, email, role, branch, status, and join date.

#### Scenario: Employees list renders
- **WHEN** navigating to /employees
- **THEN** the system SHALL display a table of employees with avatar placeholder (initials), name, email, role badge, assigned branch, status badge (active/inactive), and join date

#### Scenario: Filter by role
- **WHEN** selecting a role filter (e.g., "Manager")
- **THEN** the table SHALL show only employees with that role

#### Scenario: Loading state shows skeleton
- **WHEN** employee data is loading
- **THEN** the table SHALL display Skeleton rows with shimmer animation
