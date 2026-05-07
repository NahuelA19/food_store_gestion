## MODIFIED Requirements

### Requirement: User registration with email and password
The system SHALL allow new users to register with an email address and password. The password SHALL be hashed using bcrypt before storage, and SHALL NOT be stored in plaintext.

**CHANGE**: Include optional profile fields on registration (first_name, last_name, phone). Profile fields are optional for MVP, but collected during registration if provided.

#### Scenario: Successful registration with full profile
- **WHEN** user submits registration form with email, password, first_name, last_name, phone
- **THEN** system creates user record with profile fields populated, returns JWT token

#### Scenario: Successful registration with email/password only
- **WHEN** user submits registration form with only email and password (profile fields omitted)
- **THEN** system creates user record with empty profile fields, returns JWT token

#### Scenario: Duplicate email rejected
- **WHEN** user attempts to register with email already in database
- **THEN** system returns HTTP 409 Conflict with error message "Email already registered"

#### Scenario: Weak password rejected
- **WHEN** user submits password with fewer than 8 characters
- **THEN** system returns HTTP 422 Unprocessable Entity with error message "Password must be at least 8 characters"

#### Scenario: Invalid email format
- **WHEN** user submits email without valid format (e.g., "notanemail")
- **THEN** system returns HTTP 422 Unprocessable Entity with error message "Invalid email format"

#### Scenario: Invalid profile fields on registration
- **WHEN** user submits first_name with invalid length on registration
- **THEN** system returns HTTP 422 with validation error (profile validation same as `PUT /api/users/me`)

### Requirement: User login returns profile in response
The system SHALL include user profile information in the login response, along with the JWT token.

**CHANGE**: Login response now includes user object with id, email, first_name, last_name, phone (if available).

#### Scenario: Login returns full user object
- **WHEN** user submits login form with correct credentials
- **THEN** system returns JWT token AND user object: `{"id": 1, "email": "user@example.com", "first_name": "John", "last_name": "Doe", "phone": "+1-555-123-4567", "access_token": "...", "token_type": "bearer"}`

#### Scenario: User not found
- **WHEN** user submits login form with email not in database
- **THEN** system returns HTTP 401 Unauthorized with error message "Invalid credentials"

#### Scenario: Inactive user login blocked
- **WHEN** user with `is_active=false` attempts to login
- **THEN** system returns HTTP 403 Forbidden with error message "Account is inactive"

### Requirement: JWT token generation and validation
The system SHALL generate JWT tokens containing user ID and email claims, signed with HS256 algorithm. Tokens SHALL include expiration time (15 minutes). The system SHALL validate token signature and expiration on each request.

#### Scenario: Valid token accepted
- **WHEN** API request includes valid JWT in Authorization header (Bearer scheme)
- **THEN** system extracts and validates token, allowing request to proceed

#### Scenario: Expired token rejected
- **WHEN** API request includes JWT with expiration timestamp in the past
- **THEN** system returns HTTP 401 Unauthorized with error message "Token expired"

#### Scenario: Invalid token signature
- **WHEN** API request includes JWT signed with different key
- **THEN** system returns HTTP 401 Unauthorized with error message "Invalid token"

#### Scenario: Malformed token rejected
- **WHEN** API request includes malformed JWT (not valid format)
- **THEN** system returns HTTP 401 Unauthorized with error message "Invalid token"

### Requirement: Protected endpoints require authentication
The system SHALL require valid JWT token for access to protected endpoints. Unauthenticated requests SHALL return HTTP 401.

#### Scenario: Protected endpoint with valid token
- **WHEN** authenticated request includes valid JWT
- **THEN** system allows request to proceed

#### Scenario: Protected endpoint without token
- **WHEN** unauthenticated request has no JWT
- **THEN** system returns HTTP 401 Unauthorized

#### Scenario: Protected endpoint with invalid token
- **WHEN** request includes invalid/expired JWT
- **THEN** system returns HTTP 401 Unauthorized
