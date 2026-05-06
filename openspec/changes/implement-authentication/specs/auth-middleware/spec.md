## ADDED Requirements

### Requirement: Authentication middleware for route protection
The system SHALL provide a mechanism to protect API routes by requiring valid JWT authentication. Route handlers decorated with `@require_auth()` SHALL extract user identity from JWT and inject authenticated user into the request context.

#### Scenario: Protected route accepts authenticated request
- **WHEN** request to protected endpoint includes valid JWT in Authorization header
- **THEN** middleware validates token, extracts user ID, injects user into route handler context, and allows request to proceed

#### Scenario: Protected route rejects unauthenticated request
- **WHEN** request to protected endpoint lacks valid JWT
- **THEN** middleware returns HTTP 401 Unauthorized with error message "Authentication required"

#### Scenario: Public route bypasses authentication
- **WHEN** request to public endpoint (not decorated with `@require_auth()`) is submitted
- **THEN** middleware allows request to proceed without authentication check

### Requirement: Dependency injection of authenticated user
The system SHALL provide FastAPI dependency (`get_current_user()`) that route handlers can inject to access authenticated user object. If token is invalid or missing, dependency SHALL raise HTTP 401.

#### Scenario: Route handler receives authenticated user
- **WHEN** route handler injects `get_current_user()` dependency and receives valid JWT
- **THEN** handler receives User object with `id` and `email` attributes

#### Scenario: Invalid token raises 401
- **WHEN** route handler injects `get_current_user()` and request JWT is invalid
- **THEN** FastAPI automatically returns HTTP 401 Unauthorized

#### Scenario: Optional authentication
- **WHEN** route handler uses optional dependency (e.g., `Optional[User]`)
- **THEN** handler receives User object if authenticated, or None if unauthenticated

### Requirement: JWT extraction from Authorization header
The system SHALL extract JWT from the Authorization header using Bearer scheme (format: `Authorization: Bearer <token>`). The system SHALL reject requests with malformed Authorization header.

#### Scenario: Valid Bearer token extracted
- **WHEN** request includes `Authorization: Bearer eyJhbGc...` (valid JWT)
- **THEN** system extracts token and validates it

#### Scenario: Malformed Authorization header rejected
- **WHEN** request includes `Authorization: Basic abc123` (not Bearer scheme)
- **THEN** system returns HTTP 401 Unauthorized with error message "Invalid authorization scheme"

#### Scenario: Missing Bearer token value
- **WHEN** request includes `Authorization: Bearer` (empty token)
- **THEN** system returns HTTP 401 Unauthorized with error message "Missing token"

### Requirement: Token signature and expiration validation
The system SHALL validate JWT signature using configured secret key and verify token has not expired. Invalid or expired tokens SHALL result in HTTP 401.

#### Scenario: Valid signature passes validation
- **WHEN** JWT is signed with correct secret key and not expired
- **THEN** system accepts token and extracts claims

#### Scenario: Expired token rejected
- **WHEN** JWT `exp` claim is in the past
- **THEN** system returns HTTP 401 Unauthorized with error message "Token has expired"

### Requirement: Error responses for authentication failures
The system SHALL return standardized error responses for all authentication failures. Error responses SHALL include HTTP status code and descriptive message.

#### Scenario: Missing auth header error response
- **WHEN** protected route accessed without Authorization header
- **THEN** system returns: `{"detail": "Missing authorization header"}` with HTTP 401

#### Scenario: Invalid token error response
- **WHEN** protected route accessed with malformed JWT
- **THEN** system returns: `{"detail": "Invalid token"}` with HTTP 401
