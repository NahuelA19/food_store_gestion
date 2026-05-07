## ADDED Requirements

### Requirement: Profile fields are validated on input
The system SHALL validate all profile field inputs before accepting them.

#### Scenario: First name validation
- **WHEN** user submits first_name with 0 characters
- **THEN** system returns HTTP 422 with error "first_name required, 1-50 characters"

- **WHEN** user submits first_name with 51+ characters
- **THEN** system returns HTTP 422 with error "first_name must be 1-50 characters"

- **WHEN** user submits first_name with valid 1-50 characters
- **THEN** system accepts and saves the value

#### Scenario: Last name validation
- **WHEN** user submits last_name with invalid length (0 or 51+)
- **THEN** system returns HTTP 422 with validation error

- **WHEN** user submits last_name with valid 1-50 characters
- **THEN** system accepts and saves the value

#### Scenario: Phone validation
- **WHEN** user submits phone with invalid format (e.g., "abc")
- **THEN** system returns HTTP 422 with error "phone must be 7-20 characters, may contain +, -, (), spaces"

- **WHEN** user submits phone with valid format (e.g., "+1-555-123-4567")
- **THEN** system accepts and saves the value

- **WHEN** user omits phone field
- **THEN** system accepts (phone is optional)

### Requirement: Preference values are validated against allowed list
The system SHALL validate preference values against a predefined set of allowed values.

#### Scenario: Language validation
- **WHEN** user sets language to "en", "es", "fr", or "de"
- **THEN** system accepts and saves the value

- **WHEN** user sets language to unsupported value (e.g., "xx")
- **THEN** system returns HTTP 422 with error "language must be one of: en, es, fr, de"

#### Scenario: Theme validation
- **WHEN** user sets theme to "light", "dark", or "auto"
- **THEN** system accepts and saves the value

- **WHEN** user sets theme to invalid value (e.g., "blue")
- **THEN** system returns HTTP 422 with error "theme must be one of: light, dark, auto"

#### Scenario: Notifications validation
- **WHEN** user sets notifications to "email", "push", or "off"
- **THEN** system accepts and saves the value

- **WHEN** user sets notifications to invalid value (e.g., "sms")
- **THEN** system returns HTTP 422 with error "notifications must be one of: email, push, off"

### Requirement: Email uniqueness is enforced
The system SHALL prevent multiple users from having the same email address.

#### Scenario: Email uniqueness on registration (handled by auth, not this change)
- **WHEN** user registers with an email
- **THEN** system ensures uniqueness (existing requirement from Change 3)

#### Scenario: Email cannot be changed in profile update
- **WHEN** user attempts to update email via `PUT /api/users/me`
- **THEN** system either ignores the email field or returns HTTP 422 (email immutable)

### Requirement: Input sanitization prevents injection attacks
The system SHALL sanitize all text inputs before storing in database.

#### Scenario: SQL injection attempt in first_name
- **WHEN** user submits first_name with SQL injection payload (e.g., `"; DROP TABLE users; --`)
- **THEN** system treats it as literal string, stores safely, no database harm

#### Scenario: XSS attempt in last_name
- **WHEN** user submits last_name with XSS payload (e.g., `<script>alert('xss')</script>`)
- **THEN** system treats as literal string, frontend escapes on display

### Requirement: Batch validation provides clear error messages
The system SHALL provide clear, actionable error messages for validation failures.

#### Scenario: Multiple validation errors
- **WHEN** user submits profile with first_name="" and phone="abc"
- **THEN** system returns HTTP 422 with error details: `{"first_name": ["required, 1-50 chars"], "phone": ["invalid format"]}`

#### Scenario: Single validation error
- **WHEN** user submits with one invalid field
- **THEN** system returns HTTP 422 with specific error for that field only
