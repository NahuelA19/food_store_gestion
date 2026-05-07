## ADDED Requirements

### Requirement: User can delete own account
The system SHALL allow authenticated users to permanently delete their own account (soft delete in database).

#### Scenario: Delete account successfully
- **WHEN** authenticated user calls `DELETE /api/users/me`
- **THEN** system soft-deletes the user (marks deleted_at timestamp), returns HTTP 204 No Content

#### Scenario: Delete account without authentication
- **WHEN** unauthenticated request calls `DELETE /api/users/me`
- **THEN** system returns HTTP 401 Unauthorized

#### Scenario: Deleted user cannot login
- **WHEN** user deletes account then tries to login with same email/password
- **THEN** system returns HTTP 401 Unauthorized (user not found or inactive)

#### Scenario: Deleted user's profile not accessible
- **WHEN** another user calls `GET /api/users/{deleted_user_id}`
- **THEN** system returns HTTP 404 Not Found (deleted users are hidden)

### Requirement: Admin can list all users with pagination
The system SHALL allow admin users only to list all users with cursor-based pagination.

#### Scenario: Admin lists users successfully
- **WHEN** admin-authenticated user calls `GET /api/users?limit=10`
- **THEN** system returns HTTP 200 with paginated user list (10 users max), next_cursor included if more users exist

#### Scenario: Non-admin user cannot list users
- **WHEN** regular authenticated user calls `GET /api/users`
- **THEN** system returns HTTP 403 Forbidden

#### Scenario: Unauthenticated request cannot list users
- **WHEN** unauthenticated request calls `GET /api/users`
- **THEN** system returns HTTP 401 Unauthorized

#### Scenario: Pagination with cursor
- **WHEN** admin calls `GET /api/users?cursor=abc123&limit=10`
- **THEN** system returns next page of users starting after the cursor, includes new cursor for next page

### Requirement: Admin can deactivate users
The system SHALL allow admin users only to deactivate (not delete) user accounts.

#### Scenario: Admin deactivates user successfully
- **WHEN** admin calls `PATCH /api/users/{id}/status` with `{"is_active": false}`
- **THEN** system updates is_active flag, returns HTTP 200

#### Scenario: Deactivated user cannot login
- **WHEN** deactivated user tries to login
- **THEN** system returns HTTP 401 Unauthorized

#### Scenario: Regular user cannot deactivate other users
- **WHEN** regular authenticated user calls `PATCH /api/users/{id}/status`
- **THEN** system returns HTTP 403 Forbidden

### Requirement: Response schema is consistent
The system SHALL return user profiles in a consistent schema across all endpoints.

#### Scenario: All endpoints return same profile schema
- **WHEN** user calls `GET /api/users/me`, `GET /api/users/{id}`, or `PUT /api/users/me`
- **THEN** all endpoints return the same fields in the same structure (or publicly-limited version)

### Requirement: Timestamps are included
The system SHALL include created_at and updated_at timestamps in all profile responses.

#### Scenario: Timestamps included in response
- **WHEN** user calls `GET /api/users/me`
- **THEN** response includes ISO 8601 formatted created_at and updated_at timestamps
