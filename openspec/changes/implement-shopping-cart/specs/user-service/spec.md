# Spec: User Service (Modified for Shopping Cart)

**Status**: Approved  
**Version**: 1.1  
**Owner**: Backend Team

---

## Overview

This spec documents MODIFIED requirements for the User Service to support shopping cart integration. The User entity now maintains an optional relationship to an active cart. This change enables the backend to efficiently retrieve a user's cart during login and persist cart associations across sessions.

---

## MODIFIED Requirements

### Requirement: User Profile with Cart Association

The system SHALL maintain user profile with: `id`, `email`, `username`, `full_name`, `hashed_password`, `is_active`, `cart_id` (nullable), `profile_picture`, `created_at`, `updated_at`.

The `cart_id` field is an optional foreign key reference to the user's currently active shopping cart (status="active"). Multiple users cannot share a cart.

#### Scenario: User with active cart
- **WHEN** user has items in their shopping cart
- **THEN** user.cart_id references the active cart's id
- **THEN** GET `/api/v1/users/{user_id}` response includes `cart_id: 123`
- **THEN** GET `/api/v1/carts` returns this cart directly

#### Scenario: User without cart
- **WHEN** user is newly created or hasn't added items yet
- **THEN** user.cart_id is NULL
- **WHEN** GET `/api/v1/users/{user_id}` is called
- **THEN** response includes `cart_id: null`

#### Scenario: User creates cart implicitly on first add-to-cart
- **WHEN** user adds first product to cart
- **THEN** new Cart record is created in database
- **THEN** user.cart_id is updated to point to new cart
- **THEN** GET `/api/v1/users/{user_id}` now shows the cart_id

#### Scenario: User checks out
- **WHEN** user's cart transitions to `checked_out`
- **THEN** user.cart_id remains set to the checked-out cart (still references it)
- **THEN** user can still view the completed cart (read-only)
- **THEN** next add-to-cart operation creates a NEW cart for the user

#### Scenario: Logout does NOT clear cart
- **WHEN** user logs out
- **THEN** user.cart_id remains unchanged
- **THEN** cart data persists in database
- **WHEN** user logs back in
- **THEN** same cart_id is restored
- **THEN** cart contents are exactly as before (persist across sessions)

#### Scenario: User account deletion cascades to cart
- **WHEN** user is deleted from database
- **THEN** user's cart (and all cart items) are deleted via ON DELETE CASCADE
- **THEN** cart data is cleaned up automatically

### Requirement: Authentication Initialize or Retrieve Cart

Upon successful login, the authentication system SHALL check if user has an existing active cart (`status="active"`). If cart exists, it is returned to frontend. If no cart exists, none is created (cart is created on first add-to-cart only).

#### Scenario: User logs in with existing cart
- **WHEN** user logs in successfully
- **WHEN** user has existing cart with `status="active"` and `user_id` matching
- **THEN** authentication system retrieves cart
- **THEN** JWT payload or response includes `cart_id`
- **THEN** frontend can immediately fetch cart contents

#### Scenario: User logs in without cart
- **WHEN** user logs in successfully
- **WHEN** user has no cart (first time or after previous checkout)
- **THEN** authentication returns user profile with `cart_id=null`
- **THEN** cart remains null until user adds first item

#### Scenario: Only active carts are retrieved at login
- **WHEN** user has checked_out cart from previous session
- **THEN** GET `/api/v1/carts` after login returns 404 (no active cart)
- **THEN** user.cart_id may still reference old checked_out cart, or is cleared
- **THEN** next add-to-cart creates new active cart

### Requirement: User Service Endpoints Include Cart Info

User profile endpoints now include `cart_id` in response. Existing user endpoints remain unchanged; only responses are extended.

#### Scenario: GET /api/v1/users/me includes cart_id
- **WHEN** authenticated user calls GET `/api/v1/users/me`
- **THEN** response includes: `id`, `email`, `username`, `full_name`, `cart_id`, `is_active`, `created_at`, `updated_at`
- **THEN** `cart_id` is null or an integer

#### Scenario: GET /api/v1/users/{user_id} includes cart_id
- **WHEN** authenticated user calls GET `/api/v1/users/{user_id}`
- **THEN** response includes `cart_id` field
- **THEN** user can only view their own profile (or admin can view any)

#### Scenario: POST /api/v1/users/{user_id}/logout can clear cart session (optional)
- **WHEN** user calls logout endpoint
- **THEN** JWT is invalidated on client side
- **THEN** user.cart_id remains set (cart persists server-side)
- **THEN** next login retrieves same cart

### Requirement: Cart Relationship Consistency

The system SHALL maintain consistency between User.cart_id and Cart.user_id. Database constraints ensure one active cart per user.

#### Scenario: Unique constraint on (user_id, cart_status)
- **WHEN** attempting to create second active cart for same user
- **THEN** database UNIQUE constraint prevents insert
- **THEN** system enforces one-active-cart-per-user invariant

#### Scenario: Foreign key constraint
- **WHEN** user is deleted
- **THEN** ON DELETE CASCADE removes associated cart
- **WHEN** cart is deleted
- **THEN** user.cart_id is automatically set to NULL (handled by application or database trigger)

---

## Data Model Extension

**User Entity** (PostgreSQL table `users` — modified):

```sql
ALTER TABLE users ADD COLUMN cart_id INTEGER REFERENCES carts(id) ON DELETE SET NULL;
ALTER TABLE users ADD INDEX idx_users_cart_id (cart_id);
```

**User Table Fields**:

```
id                  SERIAL PRIMARY KEY
email               VARCHAR(255) NOT NULL UNIQUE
username            VARCHAR(100) NOT NULL
hashed_password     VARCHAR(255) NOT NULL
full_name           VARCHAR(255)
is_active           BOOLEAN DEFAULT true
profile_picture     VARCHAR(255) NULLABLE
cart_id             INTEGER NULLABLE REFERENCES carts(id) ON DELETE SET NULL
created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

INDEXES:
  idx_users_email (email)
  idx_users_cart_id (cart_id)
```

**Response Model** (UserResponse in API — extended):

```json
{
  "id": 456,
  "email": "user@example.com",
  "username": "john_doe",
  "full_name": "John Doe",
  "is_active": true,
  "profile_picture": "https://...",
  "cart_id": 123,
  "created_at": "2026-05-01T09:00:00Z",
  "updated_at": "2026-05-08T10:30:00Z"
}
```

---

## Endpoint Summary

| Method | Path | Purpose | Response Includes |
|--------|------|---------|-------------------|
| GET | `/api/v1/users/me` | Get current user profile | user + cart_id |
| GET | `/api/v1/users/{user_id}` | Get user profile | user + cart_id |
| POST | `/api/v1/auth/login` | Login, retrieve user + cart | JWT + user + cart_id |
| POST | `/api/v1/auth/logout` | Logout (client-side JWT invalidation) | - |

---

## Validation Rules

- `cart_id` must reference an existing cart (foreign key constraint)
- A user can have at most one active cart (UNIQUE constraint)
- `user_id` in Cart table must reference an existing User
- If Cart is deleted, User.cart_id is set to NULL
- If User is deleted, associated Cart is deleted (cascade)

---

## Compatibility Notes

- Existing user authentication flows are unchanged
- Existing endpoints remain backward compatible
- `cart_id` field is optional and nullable for clients to ignore
- No breaking changes to existing User API responses (only additions)

