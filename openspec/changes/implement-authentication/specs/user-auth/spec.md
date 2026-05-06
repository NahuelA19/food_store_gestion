## ADDED Requirements

### Requirement: User registration with email and password
The system SHALL allow new users to register with an email address and password. The password SHALL be hashed using bcrypt before storage, and SHALL NOT be stored in plaintext.

#### Scenario: Successful registration
- **WHEN** user submits registration form with valid email and password
- **THEN** system creates new user record, hashes password, sets `is_active=true`, and returns JWT token

#### Scenario: Duplicate email rejected
- **WHEN** user attempts to register with email already in database
- **THEN** system returns HTTP 409 Conflict with error message "Email already registered"

#### Scenario: Weak password rejected
- **WHEN** user submits password with fewer than 8 characters
- **THEN** system returns HTTP 422 Unprocessable Entity with error message "Password must be at least 8 characters"

#### Scenario: Invalid email format
- **WHEN** user submits email without valid format (e.g., "notanemail")
- **THEN** system returns HTTP 422 Unprocessable Entity with error message "Invalid email format"

### Requirement: User login with email and password
The system SHALL authenticate users by verifying email and password credentials against stored hashed passwords. On successful authentication, the system SHALL generate and return a JWT token.

#### Scenario: Successful login
- **WHEN** user submits login form with correct email and password
- **THEN** system validates credentials, generates JWT token (expires in 15 minutes), and returns token to client

#### Scenario: Incorrect password
- **WHEN** user submits login form with correct email but wrong password
- **THEN** system returns HTTP 401 Unauthorized with error message "Invalid credentials"

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

#### Scenario: Invalid signature rejected
- **WHEN** API request includes JWT with invalid signature (tampered token)
- **THEN** system returns HTTP 401 Unauthorized with error message "Invalid token"

#### Scenario: Missing authorization header
- **WHEN** API request to protected endpoint lacks Authorization header
- **THEN** system returns HTTP 401 Unauthorized with error message "Missing authorization header"

### Requirement: User logout
The system SHALL provide logout functionality by invalidating JWT tokens on the client side. The client SHALL delete stored tokens from localStorage, effectively logging out the user.

#### Scenario: Client-side logout
- **WHEN** user clicks logout button on frontend
- **THEN** client deletes JWT from localStorage and redirects to login page

### Requirement: Password hashing with bcrypt
The system SHALL hash all passwords using bcrypt with cost factor of 12 before storing in database. The system SHALL never store plaintext passwords.

#### Scenario: Password hashed on registration
- **WHEN** new user registers with password "MyPassword123"
- **THEN** system stores hashed version (e.g., "$2b$12$...") in database, NOT plaintext

#### Scenario: Verification against hashed password
- **WHEN** user logs in and submits password "MyPassword123"
- **THEN** system verifies submitted password against stored hash using bcrypt, confirms match
