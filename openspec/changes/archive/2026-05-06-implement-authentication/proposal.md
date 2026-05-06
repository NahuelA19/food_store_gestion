## Why

Food Store requires secure user identity and access control to enable user registration, login, and personalized experiences. JWT-based authentication with bcrypt password hashing establishes the foundational security layer before implementing user profiles, orders, and authorization checks across the platform.

## What Changes

- New JWT token generation and validation endpoint (`POST /api/auth/register`, `POST /api/auth/login`)
- User password storage with bcrypt hashing (no plaintext passwords)
- Authentication middleware to extract and validate JWT tokens from request headers
- Protected endpoints decorated with `@require_auth()` to restrict access to authenticated users
- User authentication state accessible to route handlers via dependency injection
- Frontend login/register forms with JWT token storage (localStorage)
- Logout functionality and token expiration handling
- Password validation rules (minimum length, complexity)

## Capabilities

### New Capabilities
- `user-auth`: JWT token generation, user registration, login/logout flow, password hashing with bcrypt
- `auth-middleware`: Route protection, token validation, authentication state injection
- `auth-frontend`: Login/register UI, JWT token storage, session state management

### Modified Capabilities
- `core-entities`: User model extends with authentication-specific fields (hashed_password, is_active flags)

## Impact

- **Backend**: New FastAPI routes (`auth.py`), middleware layer, bcrypt dependency, database User model updates
- **Frontend**: New pages (`LoginPage`, `RegisterPage`), context/hook for auth state, localStorage for token persistence
- **Database**: User table extends with authentication fields
- **Dependencies**: `python-jose[cryptography]`, `passlib[bcrypt]`, frontend JWT library (`jsonwebtoken` or similar)
- **Breaking Changes**: None (new feature, backwards compatible)
- **Authorization Gating**: All subsequent changes (user service, products, orders) depend on this to implement role checks
