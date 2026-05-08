# Spec: Shopping Cart Core Capability

**Status**: Approved  
**Version**: 1.0  
**Owner**: Backend Team

---

## Overview

The shopping cart is the central entity for managing items a user intends to purchase. Carts are persistent, user-specific, and tied to the checkout workflow. Each authenticated user has exactly one active cart at a time.

---

## ADDED Requirements

### Requirement: Cart Creation & Management

The system SHALL create and maintain one cart per authenticated user. A cart is created either explicitly via API or implicitly when a user adds their first item. A cart has: `id`, `user_id`, `created_at`, `updated_at`, `expires_at`, and `status`.

Cart status values:
- `"active"` — Cart is open for modifications; items can be added, removed, or updated
- `"checked_out"` — Cart has transitioned to checkout; immutable; no further item changes allowed

#### Scenario: Implicit cart creation on first item add
- **WHEN** authenticated user adds first product to cart
- **THEN** system creates new cart record with `user_id`, `status="active"`, and `created_at=now()`
- **THEN** cart item is added to this newly created cart

#### Scenario: Explicit cart creation via POST
- **WHEN** authenticated user calls POST `/api/v1/carts`
- **THEN** system creates new cart for user with `status="active"`
- **THEN** system returns CartResponse (id, user_id, items=[], created_at, updated_at)

#### Scenario: User navigates to cart page
- **WHEN** authenticated user navigates to `/cart` or calls GET `/api/v1/carts/{cart_id}`
- **THEN** system returns existing active cart with all items and computed totals
- **THEN** response includes: `id`, `user_id`, `items[]`, `item_count`, `subtotal`, `created_at`, `updated_at`

#### Scenario: Cart not found
- **WHEN** user requests cart with `cart_id` that does not exist or belongs to another user
- **THEN** system returns HTTP 404 Not Found with message "Cart not found"

#### Scenario: Unauthenticated user cannot access cart
- **WHEN** unauthenticated request attempts to access any cart endpoint (GET, POST, PATCH, DELETE)
- **THEN** system returns HTTP 401 Unauthorized with message "Authentication required"

#### Scenario: Cart persistence across sessions
- **WHEN** authenticated user logs out and logs back in
- **THEN** system retrieves and returns the same cart (same `id`, `items`, totals)
- **THEN** cart data is fully intact (no data loss)

### Requirement: Cart Retrieval

The system SHALL provide endpoints to fetch current user's cart and cart details. All cart responses include computed totals (subtotal, tax estimate, total) and item count.

#### Scenario: Fetch current user's active cart
- **WHEN** authenticated user calls GET `/api/v1/carts` (no path parameter)
- **THEN** system returns current active cart or HTTP 404 if no cart exists
- **THEN** response includes: `id`, `user_id`, `items[]`, `item_count`, `subtotal`, `total_items_count`, `created_at`, `updated_at`

#### Scenario: Fetch cart by ID
- **WHEN** authenticated user calls GET `/api/v1/carts/{cart_id}`
- **THEN** system verifies user owns this cart (403 if not)
- **THEN** system returns full cart details with items
- **THEN** each item includes: `id`, `product_id`, `product_name`, `unit_price`, `quantity`, `subtotal`

#### Scenario: Cart item count reflects total quantity
- **WHEN** cart has: item A (qty=3), item B (qty=2)
- **THEN** response field `total_items_count` equals 5
- **THEN** response field `item_count` equals 2 (number of unique products)

#### Scenario: Guest user cannot fetch cart
- **WHEN** unauthenticated request calls GET `/api/v1/carts`
- **THEN** system returns HTTP 401 Unauthorized

### Requirement: Cart State Persistence

The system SHALL persist cart state in PostgreSQL database. Cart data is owned by the backend and remains consistent across user sessions, devices, and application restarts. Carts remain active indefinitely until user checks out or explicitly clears.

#### Scenario: Cart persists after server restart
- **WHEN** user adds item to cart
- **THEN** backend service is restarted
- **WHEN** same user logs back in
- **THEN** cart and items are restored exactly as before

#### Scenario: Cart accessible from any device
- **WHEN** user adds item to cart on device A
- **THEN** user logs in on device B
- **THEN** cart on device B shows the same items added on device A (real-time sync)

#### Scenario: Cart database constraints
- **WHEN** attempting to create second active cart for same user
- **THEN** database UNIQUE constraint on `(user_id, status="active")` prevents insert
- **THEN** system enforces one-cart-per-user invariant

#### Scenario: Cart is NOT deleted when product stock changes
- **WHEN** product in cart becomes out of stock
- **THEN** cart and cart items persist
- **THEN** availability check is deferred to checkout (not at cart read time)

#### Scenario: Multiple users have independent carts
- **WHEN** User A and User B both add items to carts
- **THEN** User A's cart is isolated from User B's cart
- **THEN** no cross-user data leakage

### Requirement: Cart Expiration Policy

The system MAY expire carts after a configured inactivity period (default: no expiration). Carts with `expires_at` in the past are considered expired and treated as stale.

#### Scenario: Cart does not auto-expire by default
- **WHEN** user creates cart
- **THEN** `expires_at` is NULL
- **THEN** cart remains available indefinitely (or until user logs out)

#### Scenario: Optional expiration field for future use
- **WHEN** business rules require expiring carts (e.g., after 30 days)
- **THEN** `expires_at` can be set to a future timestamp
- **THEN** system can implement background job to archive/delete expired carts

---

## Data Model

**Cart Entity** (PostgreSQL table `carts`):

```
id              SERIAL PRIMARY KEY
user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE
status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checked_out'))
created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
expires_at      TIMESTAMP WITH TIME ZONE NULLABLE

INDEXES:
  idx_carts_user_id (user_id)
  idx_carts_status (status)
  idx_carts_expires_at (expires_at)
```

**Response Model** (CartResponse in API):

```json
{
  "id": 123,
  "user_id": 456,
  "status": "active",
  "items": [
    {
      "id": 1001,
      "product_id": 789,
      "product_name": "Organic Tomatoes",
      "unit_price": "4.99",
      "quantity": 2,
      "subtotal": "9.98"
    }
  ],
  "item_count": 1,
  "total_items_count": 2,
  "subtotal": "9.98",
  "created_at": "2026-05-08T10:00:00Z",
  "updated_at": "2026-05-08T10:30:00Z"
}
```

---

## Endpoint Summary

| Method | Path | Purpose | Auth Required | Status Codes |
|--------|------|---------|---------------|-------------|
| GET | `/api/v1/carts` | Get current user's active cart | Yes | 200/401/404 |
| GET | `/api/v1/carts/{cart_id}` | Get cart by ID | Yes | 200/401/403/404 |
| POST | `/api/v1/carts` | Create new cart (explicit) | Yes | 201/401 |
| DELETE | `/api/v1/carts/{cart_id}` | Delete entire cart | Yes | 204/401/403/404 |

---

## Error Handling

| Error | HTTP Code | Message | When |
|-------|-----------|---------|------|
| Unauthorized | 401 | "Authentication required" | No JWT token or invalid token |
| Forbidden | 403 | "Cannot access this cart" | User attempts to access another user's cart |
| Not Found | 404 | "Cart not found" | Cart ID does not exist or user has no active cart |
| Conflict | 409 | "Cart already checked out" | Attempt to modify checked_out cart |

---

## Validation Rules

- `user_id` must reference an existing, active user
- `status` must be one of: `"active"`, `"checked_out"`
- `created_at` and `updated_at` must be valid ISO 8601 timestamps
- Only authenticated users can create or fetch carts
- User can only access their own cart (authorization check)

