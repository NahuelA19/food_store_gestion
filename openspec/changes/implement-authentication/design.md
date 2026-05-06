## Context

Food Store is a full-stack e-commerce platform built with FastAPI (Python) backend and React (TypeScript) frontend. Currently, the project has:
- PostgreSQL database with User, Product, Category, Order models
- Basic project structure and CI/CD pipelines
- No authentication or authorization layer

The authentication layer must integrate with existing ORM models, allow for future authorization checks (role-based access control), and provide a clean API for frontend consumption.

## Goals / Non-Goals

**Goals:**
- Implement secure JWT-based authentication (stateless)
- Support user registration with email + password
- Support user login with credential validation
- Protect backend routes via authentication middleware
- Provide frontend with token storage and session management
- Allow seamless logout and token expiration handling
- Establish patterns for future authorization (roles, permissions)

**Non-Goals:**
- OAuth2 / social login (out of scope for Phase 1)
- Multi-factor authentication (future enhancement)
- Session-based authentication (using JWT, not sessions)
- Role-based access control implementation (reserved for Change 4+)
- Password reset flow (will implement separately)

## Decisions

### 1. JWT (JSON Web Tokens) for Stateless Authentication
**Decision**: Use JWT with RS256 (RSA) or HS256 (HMAC) signature for token generation and validation.

**Rationale**:
- Stateless: No server-side session storage needed, scales horizontally
- Industry standard for REST APIs
- Supports future mobile app integration (native JWT handling)
- Self-contained: token carries user identity

**Alternatives Considered**:
- Session-based (Flask-Session style): Requires server-side storage, doesn't scale well for distributed backends
- OAuth2 (full spec): Overkill for initial implementation, adds complexity
- Chosen: JWT with HS256 (simpler, single-key setup for Phase 1)

### 2. Bcrypt for Password Hashing
**Decision**: Use `bcrypt` via `passlib` library for password hashing and verification.

**Rationale**:
- Industry standard, proven secure
- Automatic salt generation
- Work factor (cost) tunable for future hardening
- Immune to rainbow table attacks
- Native Python support via `passlib`

**Alternatives Considered**:
- Plain SHA256: Vulnerable to brute force
- Argon2: More complex, marginal benefit for e-commerce; bcrypt sufficient
- Chosen: bcrypt (good balance of security and simplicity)

### 3. Authentication Middleware Pattern
**Decision**: Implement authentication as FastAPI dependency (`Depends(get_current_user)`) injected into route handlers.

**Rationale**:
- Follows FastAPI conventions
- Optional/flexible per route (not all routes require auth)
- Clean separation of concerns (auth logic separate from route logic)
- Easy to test (inject mock user)
- Allows gradual rollout (only decorate routes that need auth)

**Alternatives Considered**:
- Global middleware: Would protect all routes uniformly, harder to exclude public routes
- Decorator pattern: Duplicate logic per route
- Chosen: Dependency injection (DRY, explicit per route)

### 4. Token Expiration & Refresh Strategy
**Decision**: Use short-lived access tokens (15 minutes) with optional refresh token mechanism.

**Rationale**:
- Compromised tokens have limited window of validity
- Short expiration reduces server load for token revocation
- Refresh tokens allow persistent login without re-entering credentials
- Aligns with OAuth2 best practices

**Alternatives Considered**:
- Long-lived tokens (days/weeks): Higher security risk if compromised
- No expiration: Vulnerable to token theft
- Chosen: Short access tokens + refresh (Phase 2 enhancement)

### 5. Frontend Token Storage
**Decision**: Store JWT in `localStorage` with secure flag on Set-Cookie (if using HTTP-only cookies for refresh tokens).

**Rationale**:
- `localStorage` is accessible to JavaScript, needed for Authorization header
- XSS vulnerability mitigated by secure header validation
- Supports SPA architecture (React)

**Alternatives Considered**:
- SessionStorage: Clears on browser close (might not match user expectations)
- Cookies only (httpOnly): Cannot access from JS, requires CSRF protection
- Chosen: localStorage for access token (Phase 1), httpOnly cookies for refresh (Phase 2)

### 6. User Model Extensions
**Decision**: Extend existing User ORM model with `hashed_password` field (not store plaintext) and `is_active` boolean.

**Rationale**:
- User already exists in database
- Minimal schema changes
- `is_active` enables soft account disabling
- Future: add `last_login` timestamp for audit

**Alternatives Considered**:
- New separate User table: Redundant, complicates queries
- Plaintext passwords: Insecure, violates compliance
- Chosen: Extend existing User model

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| XSS attack stealing JWT from localStorage | CSP headers, input sanitization in React (DOMPurify) |
| Token theft via network interception | Enforce HTTPS in production, use secure flag on cookies (Phase 2) |
| Weak passwords from users | Client-side + server-side validation, password strength meter |
| Tokens never expire if stored indefinitely | Implement token expiration (15 min), refresh flow (Phase 2) |
| Database user lookup on every request | JWT is self-contained, verify signature only (fast, no DB lookup) |
| Rotating secrets / key management | Start with single key; Phase 2: implement key rotation strategy |

## Migration Plan

1. **Database**: Add `hashed_password` and `is_active` columns to users table (Alembic migration)
2. **Backend**: Implement auth routes (`/api/auth/register`, `/api/auth/login`), dependency injection, middleware
3. **Frontend**: Add LoginPage, RegisterPage components; implement token storage and auth context
4. **Testing**: Unit tests for password hashing, token generation, route protection
5. **Deployment**: No downtime; auth routes are additive (no breaking changes to existing API)
6. **Rollback**: Keep old User table schema; disable auth routes temporarily if needed

## Open Questions

1. Should we implement refresh tokens in this phase or defer to Phase 2?
   → Defer to Phase 2 (accelerate core feature development first)
2. Should we add email verification (confirm email before account activation)?
   → Out of scope for Phase 1; Phase 2+ enhancement
3. What password complexity rules should we enforce?
   → Minimum 8 characters, at least 1 uppercase, 1 number (Phase 1); entropy-based (Phase 2)
4. Should authentication be required for all API endpoints or only certain ones?
   → Selective: Product browse is public; user profile/orders require auth (Phase 2 when implementing user service)
