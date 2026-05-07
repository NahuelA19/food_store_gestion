## ADDED Requirements

### Requirement: User can view own profile
The system SHALL allow authenticated users to view their own profile information (first_name, last_name, phone, created_at, updated_at, email).

#### Scenario: Get own profile successfully
- **WHEN** authenticated user calls `GET /api/users/me`
- **THEN** system returns HTTP 200 with user profile containing all fields

#### Scenario: Get own profile without authentication
- **WHEN** unauthenticated request is made to `GET /api/users/me`
- **THEN** system returns HTTP 401 Unauthorized

### Requirement: User can view public profile of another user
The system SHALL allow any user (authenticated or not) to view limited public profile info of other users (first_name, last_name, created_at only, not email or phone).

#### Scenario: Get public profile successfully
- **WHEN** authenticated user calls `GET /api/users/{id}` with valid user ID
- **THEN** system returns HTTP 200 with limited public profile (no email, no phone, no updated_at)

#### Scenario: Get profile of non-existent user
- **WHEN** authenticated user calls `GET /api/users/{id}` with invalid user ID
- **THEN** system returns HTTP 404 Not Found

### Requirement: User can view another user's public profile
The system SHALL allow unauthenticated users to view public profiles.

#### Scenario: Public user views profile
- **WHEN** unauthenticated user calls `GET /api/users/{id}`
- **THEN** system returns HTTP 200 with limited public profile

### Requirement: User can update own profile
The system SHALL allow authenticated users to update their profile fields (first_name, last_name, phone).

#### Scenario: Update profile successfully
- **WHEN** authenticated user calls `PUT /api/users/me` with `{"first_name": "John", "last_name": "Doe", "phone": "+1-555-123-4567"}`
- **THEN** system returns HTTP 200 with updated profile, database is updated

#### Scenario: Update profile without authentication
- **WHEN** unauthenticated request calls `PUT /api/users/me`
- **THEN** system returns HTTP 401 Unauthorized

#### Scenario: Update profile with invalid phone format
- **WHEN** authenticated user calls `PUT /api/users/me` with `{"phone": "invalid"}`
- **THEN** system returns HTTP 422 Unprocessable Entity with validation error

### Requirement: User profile fields have validation rules
The system SHALL enforce validation on profile fields:
- first_name: 1-50 characters
- last_name: 1-50 characters
- phone: optional, 7-20 characters, allows +, -, (), space

#### Scenario: Validate first_name too short
- **WHEN** user submits `first_name: ""`
- **THEN** system returns HTTP 422 with error "first_name must be 1-50 characters"

#### Scenario: Validate phone format
- **WHEN** user submits `phone: "abc"`
- **THEN** system returns HTTP 422 with error "phone must be 7-20 characters with valid format"

#### Scenario: Validate all fields succeed
- **WHEN** user submits valid profile `{"first_name": "Jane", "last_name": "Smith", "phone": "5551234567"}`
- **THEN** system accepts and saves, returns HTTP 200
