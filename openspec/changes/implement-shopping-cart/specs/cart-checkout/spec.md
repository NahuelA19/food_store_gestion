# Spec: Cart Checkout Process

**Status**: Approved  
**Version**: 1.0  
**Owner**: Backend Team

---

## Overview

Checkout is the process of validating a cart and transitioning it to an immutable state, preparing for payment and order creation (detailed order placement is deferred to Change 8). During checkout, all cart items are validated: products must exist, be active, and prices must not have changed drastically. Once checkout succeeds, the cart becomes read-only and a checkout record (or order placeholder) is created.

---

## ADDED Requirements

### Requirement: Checkout Initiation

The system SHALL support initiating checkout via POST request. Checkout validates all items in the cart, calculates totals, and transitions cart to `checked_out` status. The response includes checkout confirmation and prepares for payment (payment details deferred to Change 8).

**Endpoint**: POST `/api/v1/carts/{cart_id}/checkout`

**Request Body** (minimal for now):
```json
{
  "shipping_address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701",
    "country": "US"
  },
  "shipping_method": "standard"
}
```

**Response** (200 OK):
```json
{
  "cart_id": 123,
  "item_count": 3,
  "total_items_count": 5,
  "subtotal": "34.97",
  "tax": "2.80",
  "shipping": "5.00",
  "total": "42.77",
  "status": "pending_payment",
  "created_at": "2026-05-08T10:00:00Z"
}
```

#### Scenario: Valid checkout succeeds
- **WHEN** user calls POST `/api/v1/carts/123/checkout` with valid request
- **THEN** system validates all items (existence, availability, pricing)
- **THEN** all validations pass
- **THEN** cart status is set to `"checked_out"`
- **THEN** response includes `subtotal`, `tax`, `shipping`, `total`
- **THEN** HTTP status 200 OK

#### Scenario: Cart is empty
- **WHEN** cart has no items (`items=[]`)
- **WHEN** user calls POST `/api/v1/carts/123/checkout`
- **THEN** system returns HTTP 400 Bad Request with message "Cannot checkout empty cart"
- **THEN** cart status remains `"active"`

#### Scenario: Item is no longer available
- **WHEN** cart contains product that is now `is_active=false`
- **WHEN** user calls checkout
- **THEN** system validation fails
- **THEN** system returns HTTP 400 Bad Request with message "Item 'Product Name' is no longer available"
- **THEN** cart status remains `"active"` (unchanged)
- **THEN** user can remove the item and retry checkout

#### Scenario: Item no longer exists
- **WHEN** cart contains product that has been deleted from catalog
- **WHEN** user calls checkout
- **THEN** system validation fails
- **THEN** system returns HTTP 404 Not Found with message "Item 'Product Name' not found"
- **THEN** cart status remains `"active"`

#### Scenario: Product price changed drastically
- **WHEN** cart item has `unit_price=$10.00`
- **WHEN** current product price is `$15.00` (50% increase)
- **WHEN** user calls checkout
- **THEN** system detects price change exceeds threshold (e.g., 10%)
- **THEN** system returns HTTP 400 Bad Request with message "Price for 'Product Name' has changed from $10.00 to $15.00. Please review and resubmit."
- **THEN** cart status remains `"active"` (user can review or abandon)

#### Scenario: Cart is already checked_out
- **WHEN** user calls POST checkout on cart with `status="checked_out"`
- **THEN** system returns HTTP 409 Conflict with message "Cart already checked out"

#### Scenario: User can only checkout their own cart
- **WHEN** user A attempts to checkout cart belonging to user B
- **THEN** system returns HTTP 403 Forbidden with message "Cannot access this cart"

### Requirement: Cart Validation at Checkout

The system SHALL perform multi-stage validation before checkout completion. Validation includes: item existence, product availability, pricing validation, and user address validity. Detailed error messages are returned for each validation failure.

#### Scenario: All validations pass
- **WHEN** all items exist, are active, and prices are unchanged
- **WHEN** user has valid shipping address
- **THEN** checkout proceeds successfully
- **THEN** cart transitions to `checked_out`

#### Scenario: Validation fails with multiple errors
- **WHEN** cart has: item A (deleted), item B (price +50%), item C (inactive)
- **WHEN** user calls checkout
- **THEN** system returns HTTP 400 with comprehensive error list
- **THEN** response includes: array of errors with item details and reason

#### Scenario: Shipping address required
- **WHEN** checkout request omits `shipping_address`
- **THEN** system returns HTTP 422 Unprocessable Entity with message "Shipping address is required"

#### Scenario: Shipping method required
- **WHEN** checkout request omits `shipping_method`
- **THEN** system returns HTTP 422 Unprocessable Entity with message "Shipping method is required"

#### Scenario: Invalid shipping method
- **WHEN** user submits `shipping_method="teleportation"` (not supported)
- **THEN** system returns HTTP 400 Bad Request with message "Invalid shipping method. Choose from: standard, express"

#### Scenario: Price snapshot comparison
- **WHEN** item in cart was added at price P1
- **WHEN** current product price is P2
- **WHEN** difference between P1 and P2 is within threshold (< 10%)
- **THEN** checkout allows small price changes automatically
- **THEN** new total uses P2 (product's current price)

#### Scenario: Stale product data in cart
- **WHEN** product category or description changed
- **WHEN** price and availability unchanged
- **THEN** checkout succeeds (other metadata changes are acceptable)

### Requirement: Checkout Response & Cart Immutability

Once checkout succeeds, cart transitions to `checked_out` status and becomes read-only. No items can be added, removed, or updated. The response includes full order preview (totals, items, shipping).

#### Scenario: Checkout response includes full summary
- **WHEN** checkout succeeds
- **THEN** response includes:
  - `cart_id`
  - `item_count` (number of unique products)
  - `total_items_count` (sum of quantities)
  - `subtotal` (sum of all item subtotals)
  - `tax` (calculated, details in Change 8)
  - `shipping` (based on method and address)
  - `total` (subtotal + tax + shipping)
  - `status: "pending_payment"`
  - `created_at` (checkout timestamp)

#### Scenario: Cannot add items to checked_out cart
- **WHEN** cart has `status="checked_out"`
- **WHEN** user attempts POST `/api/v1/carts/{cart_id}/items`
- **THEN** system returns HTTP 409 Conflict with message "Cannot modify checked out cart"

#### Scenario: Cannot modify items in checked_out cart
- **WHEN** cart has `status="checked_out"`
- **WHEN** user attempts PATCH `/api/v1/carts/{cart_id}/items/{item_id}`
- **THEN** system returns HTTP 409 Conflict

#### Scenario: Cannot remove items from checked_out cart
- **WHEN** cart has `status="checked_out"`
- **WHEN** user attempts DELETE `/api/v1/carts/{cart_id}/items/{item_id}`
- **THEN** system returns HTTP 409 Conflict

#### Scenario: Can read checked_out cart
- **WHEN** cart has `status="checked_out"`
- **WHEN** user calls GET `/api/v1/carts/{cart_id}`
- **THEN** system returns cart details (read-only)
- **THEN** all items and totals are visible
- **THEN** HTTP status 200 OK

#### Scenario: Later changes to products don't affect checked_out cart
- **WHEN** checkout completes for cart with item X at price $10.00
- **WHEN** product X price changes to $15.00
- **WHEN** user views checked_out cart
- **THEN** cart still shows historical price $10.00
- **THEN** totals reflect $10.00 (immutable snapshot)

### Requirement: Checkout Idempotency

The system SHOULD support idempotent checkout behavior. If user submits checkout request twice with identical data, only one checkout is processed; second request returns same response.

#### Scenario: Repeated checkout request
- **WHEN** user calls POST `/api/v1/carts/123/checkout` twice with identical data
- **THEN** first request succeeds, cart transitions to `checked_out`
- **THEN** second request detects already-checked-out cart
- **THEN** second request returns same response (idempotent)
- **THEN** HTTP status 200 OK (not 409)

---

## Data Model Extension

**Cart Status Values**:

```
"active"       — Cart is open for modifications
"checked_out"  — Cart validated and immutable; awaiting payment
```

**Checkout Response Model** (CheckoutResponse in API):

```json
{
  "cart_id": 123,
  "item_count": 2,
  "total_items_count": 5,
  "items": [
    {
      "id": 5001,
      "product_id": 456,
      "product_name": "Organic Tomatoes",
      "unit_price": "4.99",
      "quantity": 2,
      "subtotal": "9.98"
    },
    {
      "id": 5002,
      "product_id": 789,
      "product_name": "Pasta Box",
      "unit_price": "12.49",
      "quantity": 3,
      "subtotal": "37.47"
    }
  ],
  "subtotal": "47.45",
  "tax": "3.80",
  "shipping": "5.00",
  "total": "56.25",
  "shipping_address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701"
  },
  "shipping_method": "standard",
  "status": "pending_payment",
  "created_at": "2026-05-08T10:30:00Z"
}
```

**Error Response Model** (ValidationErrorResponse):

```json
{
  "error": "Checkout validation failed",
  "details": [
    {
      "item_id": 5001,
      "product_name": "Organic Tomatoes",
      "reason": "Price increased from $4.99 to $5.99 (20% change)"
    },
    {
      "item_id": 5003,
      "product_name": "Milk Carton",
      "reason": "Product is no longer available"
    }
  ]
}
```

---

## Endpoint Summary

| Method | Path | Purpose | Auth Required | Status Codes |
|--------|------|---------|---------------|-------------|
| POST | `/api/v1/carts/{cart_id}/checkout` | Validate and checkout | Yes | 200/400/401/403/404/409/422 |

---

## Error Handling

| Error | HTTP Code | Message | When |
|-------|-----------|---------|------|
| Unauthorized | 401 | "Authentication required" | No JWT token |
| Forbidden | 403 | "Cannot access this cart" | User owns different cart |
| Not Found | 404 | "Cart not found" \| "Product not found" | Resource missing |
| Bad Request | 400 | "Cart is empty" \| "Item not available" \| "Price changed" | Validation failure |
| Unprocessable Entity | 422 | "Shipping address required" \| "Invalid shipping method" | Invalid input |
| Conflict | 409 | "Cart already checked out" | Business logic violation |

---

## Validation Rules

- Cart must contain at least 1 item
- All items must exist in product catalog
- All items must have `is_active=true`
- Product prices cannot change by more than 10% (configurable threshold)
- Shipping address must include required fields (street, city, state, zip, country)
- Shipping method must be from list of supported methods
- User can only checkout their own cart
- Cart status must be `"active"` before checkout

---

## Open Questions / Deferred to Change 8

1. **Tax Calculation**: How are taxes calculated? (deferred)
2. **Shipping Cost**: How is shipping cost determined based on address and method? (deferred)
3. **Payment Processing**: How is payment captured and authorized? (deferred)
4. **Discount/Coupons**: Should checkout apply coupon codes? (deferred or separate change)
5. **Order Creation**: Should checkout create Order record or is that separate? (deferred to Change 8)

