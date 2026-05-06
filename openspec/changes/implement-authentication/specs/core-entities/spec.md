## MODIFIED Requirements

### Requirement: User entity with authentication fields
The User entity SHALL include fields for storing hashed passwords and account status. Fields: `id` (primary key), `email` (unique), `hashed_password` (bcrypt), `is_active` (boolean, default true), `created_at`, `updated_at`.

#### Scenario: User record stores hashed password
- **WHEN** new user is created with password "SecurePass123"
- **THEN** User record stores `hashed_password` as bcrypt hash (e.g., "$2b$12$..."), NOT plaintext

#### Scenario: User email is unique
- **WHEN** attempting to insert user with email that already exists
- **THEN** database unique constraint on `email` prevents insert and raises error

#### Scenario: User active status controls login
- **WHEN** user with `is_active=false` attempts to login
- **THEN** authentication system rejects login with "Account is inactive" error

#### Scenario: User timestamps track creation and updates
- **WHEN** user is created
- **THEN** `created_at` is set to current timestamp, `updated_at` is set to current timestamp

#### Scenario: User email is required
- **WHEN** attempting to create user without email
- **THEN** database NOT NULL constraint on `email` prevents insert and raises error
