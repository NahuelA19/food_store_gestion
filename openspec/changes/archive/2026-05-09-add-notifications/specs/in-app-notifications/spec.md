## ADDED Requirements

### Requirement: Notification SHALL be stored in the database
The system SHALL store notifications in a `notifications` table with fields: id (PK), user_id (FK to users), type (string: "order_confirmed", "payment_succeeded", "shipped", "delivered", "cancelled"), title (string), message (text), related_order_id (nullable FK), is_read (boolean, default false), created_at (timestamp).

#### Scenario: Notification is created and persisted
- **WHEN** a notification is created for a user
- **THEN** the system SHALL insert a row in the `notifications` table with the correct user_id, type, title, message, and is_read=false

#### Scenario: Notification references an order
- **WHEN** a notification is created due to an order event
- **THEN** the system SHALL set `related_order_id` to the corresponding order ID

### Requirement: API SHALL expose notification endpoints
The system SHALL provide these REST endpoints under `/api/notifications`:
- `GET /api/notifications/` — paginated list, optional `?unread=true` filter
- `GET /api/notifications/unread-count` — unread count
- `PATCH /api/notifications/{id}/read` — mark single as read
- `PATCH /api/notifications/read-all` — mark all as read
All endpoints SHALL require authentication.

#### Scenario: List notifications paginated
- **WHEN** a user calls `GET /api/notifications/`
- **THEN** the system SHALL return a paginated list of notifications for that user, most recent first, with `total_count`, `unread_count`, `page`, `total_pages`

#### Scenario: Unread count endpoint
- **WHEN** a user calls `GET /api/notifications/unread-count`
- **THEN** the system SHALL return `{"unread_count": N}`

#### Scenario: Mark single notification as read
- **WHEN** a user calls `PATCH /api/notifications/{id}/read`
- **THEN** the system SHALL set `is_read=true` for that notification

#### Scenario: Mark all as read
- **WHEN** a user calls `PATCH /api/notifications/read-all`
- **THEN** the system SHALL set `is_read=true` for ALL unread notifications of that user

### Requirement: Unauthenticated requests SHALL return 401
All notification endpoints SHALL require a valid JWT token.

#### Scenario: Unauthenticated list returns 401
- **WHEN** a request is made to `GET /api/notifications/` without a valid token
- **THEN** the system SHALL return 401 Unauthorized

### Requirement: Users SHALL only see their own notifications
The list endpoint SHALL filter by `user_id` matching the authenticated user.

#### Scenario: User cannot see another user's notifications
- **WHEN** user A calls `GET /api/notifications/`
- **THEN** the system SHALL NOT return notifications belonging to user B

### Requirement: Notification retention SHALL be 90 days
The system SHALL automatically delete notifications older than 90 days. This MAY be implemented as a periodic cleanup task or at query time.

#### Scenario: Old notifications are cleaned up
- **WHEN** a notification is older than 90 days
- **THEN** the system SHALL exclude it from query results and MAY delete it from the database
