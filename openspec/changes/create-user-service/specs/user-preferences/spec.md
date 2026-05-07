## ADDED Requirements

### Requirement: User can get their preferences
The system SHALL allow authenticated users to retrieve all their preferences (language, theme, notifications, etc.).

#### Scenario: Get preferences successfully
- **WHEN** authenticated user calls `GET /api/users/me/preferences`
- **THEN** system returns HTTP 200 with preferences object: `{"language": "en", "theme": "light", "notifications": "email"}`

#### Scenario: Get preferences without authentication
- **WHEN** unauthenticated request calls `GET /api/users/me/preferences`
- **THEN** system returns HTTP 401 Unauthorized

#### Scenario: Get preferences on first access
- **WHEN** new user (just registered) calls `GET /api/users/me/preferences`
- **THEN** system returns HTTP 200 with default preferences: `{"language": "en", "theme": "light", "notifications": "email"}`

### Requirement: User can update preferences
The system SHALL allow authenticated users to update their preferences.

#### Scenario: Update single preference
- **WHEN** authenticated user calls `PUT /api/users/me/preferences` with `{"theme": "dark"}`
- **THEN** system updates only the theme preference, returns HTTP 200 with all preferences

#### Scenario: Update multiple preferences
- **WHEN** authenticated user calls `PUT /api/users/me/preferences` with `{"theme": "dark", "language": "es", "notifications": "push"}`
- **THEN** system updates all provided preferences, returns HTTP 200

#### Scenario: Update preferences without authentication
- **WHEN** unauthenticated request calls `PUT /api/users/me/preferences`
- **THEN** system returns HTTP 401 Unauthorized

#### Scenario: Update with invalid preference value
- **WHEN** authenticated user calls `PUT /api/users/me/preferences` with `{"theme": "invalid-color"}`
- **THEN** system returns HTTP 422 with validation error (allowed values: light, dark, auto)

### Requirement: Preferences have supported values
The system SHALL enforce valid preference values:
- language: en, es, fr, de (or other ISO 639-1 codes added later)
- theme: light, dark, auto
- notifications: email, push, off

#### Scenario: Valid theme values
- **WHEN** user sets theme to "dark", "light", or "auto"
- **THEN** all values are accepted, stored, and returned correctly

#### Scenario: Invalid theme value
- **WHEN** user sets theme to "blue"
- **THEN** system returns HTTP 422 Unprocessable Entity

### Requirement: Preferences persist across sessions
The system SHALL retain user preferences across login sessions and page reloads.

#### Scenario: Preferences available after logout and login
- **WHEN** user sets preferences, logs out, logs back in
- **THEN** previously saved preferences are returned by `GET /api/users/me/preferences`
