# Spec: Cart Items Management

**Status**: Approved  
**Version**: 1.0  
**Owner**: Backend Team

---

## Overview

Cart items represent individual products added to a cart. Each cart item records the product selected, quantity ordered, and the price at time of addition (snapshot). Cart items are mutable—users can update quantities and remove items until cart transitions to checkout.

---

## ADDED Requirements

### Requirement: Add Item to Cart

The system SHALL support adding products to a cart via POST request. Adding an existing product updates its quantity instead of creating a duplicate. Request includes `product_id` and `quantity`. All products are validated for existence and availability before adding.

**Endpoint**: POST `/api/v1/carts/{cart_id}/items`

**Request Body**:
```json
{
  "product_id": 123,
  "quantity": 2
}
```

**Response** (200 OK or 201 Created):
```json
{
  "id": 5001,
  "cart_id": 123,
  "product_id": 456,
  "product_name": "Organic Tomatoes",
  "unit_price": "4.99",
  "quantity": 2,
  "subtotal": "9.98",
  "created_at": "2026-05-08T10:00:00Z",
  "updated_at": "2026-05-08T10:00:00Z"
}
```

#### Scenario: Add new product to cart
- **WHEN** user calls POST `/api/v1/carts/123/items` with `product_id=456, quantity=2`
- **THEN** product 456 is validated (exists, is_active=true, stock>0)
- **THEN** system creates CartItem record with `unit_price` snapshot at add time
- **THEN** response includes `id`, `product_id`, `quantity`, `unit_price`, `subtotal`
- **THEN** HTTP status 201 Created

#### Scenario: Increase quantity of existing product (idempotent-like behavior)
- **WHEN** cart already contains product_id=456 with qty=2
- **WHEN** user adds same product with qty=5
- **THEN** system updates existing CartItem to qty=5 (not qty=7)
- **THEN** `unit_price` remains at original snapshot price
- **THEN** response includes updated item with new quantity
- **THEN** HTTP status 200 OK (item merged, not created)

#### Scenario: Product not found
- **WHEN** user calls POST with `product_id=999` (non-existent)
- **THEN** system returns HTTP 404 Not Found with message "Product not found"
- **THEN** cart is unchanged

#### Scenario: Product is inactive
- **WHEN** user calls POST with `product_id` that has `is_active=false`
- **THEN** system returns HTTP 409 Conflict with message "Product not available"
- **THEN** cart is unchanged

#### Scenario: Invalid quantity
- **WHEN** user submits `quantity=0` or `quantity=-5`
- **THEN** system returns HTTP 422 Unprocessable Entity with message "Quantity must be between 1 and 999"
- **THEN** cart is unchanged

#### Scenario: Quantity exceeds max
- **WHEN** user submits `quantity=1000` (exceeds max=999)
- **THEN** system returns HTTP 422 Unprocessable Entity with message "Quantity must be between 1 and 999"
- **THEN** cart is unchanged

#### Scenario: Cart not found
- **WHEN** user calls POST `/api/v1/carts/999/items` (cart doesn't exist)
- **THEN** system returns HTTP 404 Not Found with message "Cart not found"

#### Scenario: Cart is checked_out
- **WHEN** user attempts to add item to `checked_out` cart
- **THEN** system returns HTTP 409 Conflict with message "Cannot modify checked out cart"
- **THEN** item is not added

### Requirement: Update Cart Item Quantity

The system SHALL support updating item quantity via PATCH request. Quantity must be positive. If quantity is set to 0, the item is removed automatically.

**Endpoint**: PATCH `/api/v1/carts/{cart_id}/items/{item_id}`

**Request Body**:
```json
{
  "quantity": 5
}
```

**Response** (200 OK):
```json
{
  "id": 5001,
  "cart_id": 123,
  "product_id": 456,
  "product_name": "Organic Tomatoes",
  "unit_price": "4.99",
  "quantity": 5,
  "subtotal": "24.95",
  "created_at": "2026-05-08T10:00:00Z",
  "updated_at": "2026-05-08T10:15:00Z"
}
```

#### Scenario: Increase quantity from 2 to 5
- **WHEN** user calls PATCH `/api/v1/carts/123/items/5001` with `quantity=5`
- **THEN** system validates new quantity (1-999)
- **THEN** CartItem is updated: `quantity=5`, `updated_at=now()`
- **THEN** response includes updated item with new subtotal
- **THEN** HTTP status 200 OK

#### Scenario: Decrease quantity to 0 removes item
- **WHEN** user calls PATCH with `quantity=0`
- **THEN** system removes item from cart entirely
- **THEN** HTTP status 204 No Content (or 200 with empty response)

#### Scenario: Set quantity to negative
- **WHEN** user calls PATCH with `quantity=-5`
- **THEN** system returns HTTP 422 Unprocessable Entity with message "Quantity must be between 1 and 999"
- **THEN** item is unchanged

#### Scenario: Item not in cart
- **WHEN** user calls PATCH `/api/v1/carts/123/items/9999` (item doesn't exist)
- **THEN** system returns HTTP 404 Not Found with message "Item not found in cart"

#### Scenario: User cannot update another user's cart item
- **WHEN** user A attempts PATCH on item in user B's cart
- **THEN** system returns HTTP 403 Forbidden

#### Scenario: Cannot update item in checked_out cart
- **WHEN** cart has `status="checked_out"`
- **THEN** system returns HTTP 409 Conflict with message "Cannot modify checked out cart"

### Requirement: Remove Item from Cart

The system SHALL support removing individual items via DELETE request.

**Endpoint**: DELETE `/api/v1/carts/{cart_id}/items/{item_id}`

**Response** (204 No Content):
```
(no body)
```

#### Scenario: Remove item successfully
- **WHEN** user calls DELETE `/api/v1/carts/123/items/5001`
- **THEN** CartItem record is deleted from database
- **THEN** cart remains with other items
- **THEN** HTTP status 204 No Content

#### Scenario: Item not in cart
- **WHEN** user calls DELETE with non-existent `item_id`
- **THEN** system returns HTTP 404 Not Found with message "Item not found"

#### Scenario: Cannot remove item from checked_out cart
- **WHEN** cart has `status="checked_out"`
- **THEN** system returns HTTP 409 Conflict with message "Cannot modify checked out cart"

### Requirement: Clear Cart

The system SHALL support clearing all items from a cart in a single operation.

**Endpoint**: DELETE `/api/v1/carts/{cart_id}/items` (no `item_id`)  
**Alternative**: POST `/api/v1/carts/{cart_id}/clear`

**Response** (204 No Content):
```
(no body)
```

#### Scenario: Clear active cart successfully
- **WHEN** user calls DELETE `/api/v1/carts/123/items` (no path parameter)
- **THEN** all CartItem records for this cart are deleted
- **THEN** cart remains with `status="active"`, but `items=[]`
- **THEN** HTTP status 204 No Content

#### Scenario: Clear via alternative endpoint
- **WHEN** user calls POST `/api/v1/carts/123/clear`
- **THEN** behavior is identical to DELETE `/api/v1/carts/123/items`
- **THEN** HTTP status 204 No Content

#### Scenario: Cannot clear checked_out cart
- **WHEN** cart has `status="checked_out"`
- **THEN** system returns HTTP 409 Conflict with message "Cannot clear checked out cart"

### Requirement: Cart Item Pricing

The system SHALL capture and store the product's price at the time an item is added to cart (`unit_price`). If the product's price changes later, the cart item retains its original snapshot price. Subtotal is calculated as `unit_price × quantity`.

#### Scenario: Add item at original price
- **WHEN** user adds product with current price $10.00
- **THEN** CartItem stores `unit_price=10.00`
- **THEN** subtotal is calculated as $10.00 × qty

#### Scenario: Product price changes after add
- **WHEN** product price in catalog changes from $10.00 to $12.00
- **THEN** existing CartItem in user's cart still shows `unit_price=10.00`
- **THEN** cart total reflects historical $10.00, not new $12.00
- **THEN** this behavior persists until user checks out (checkout validates current prices)

#### Scenario: Cart subtotal calculated correctly
- **WHEN** cart has: item A (unit_price=$4.99, qty=2), item B (unit_price=$7.50, qty=1)
- **THEN** item A subtotal = $9.98
- **THEN** item B subtotal = $7.50
- **THEN** cart `subtotal` = $17.48

#### Scenario: Decimal precision preserved
- **WHEN** product price is $0.99 and quantity is 3
- **THEN** subtotal is exactly $2.97 (no rounding errors)
- **THEN** all amounts stored with 2 decimal places precision (NUMERIC(10,2))

### Requirement: Product Availability Validation

The system SHALL validate product availability when adding items to cart. Validation occurs at add time (Stage 2 validation per design doc). If a product becomes inactive after being added, the cart item is flagged for availability check at checkout (not rejected immediately).

#### Scenario: Product is active when added
- **WHEN** product has `is_active=true` at add time
- **THEN** system allows item to be added to cart
- **THEN** cart item is created successfully

#### Scenario: Product becomes inactive after add
- **WHEN** product was active when added to cart
- **WHEN** admin later sets `is_active=false`
- **THEN** existing cart item remains in cart (not auto-removed)
- **THEN** item is flagged as "availability issue" for checkout validation
- **THEN** checkout process rejects cart with message "Item X is no longer available; cannot proceed"

#### Scenario: Product deleted
- **WHEN** user attempts to add product that has been deleted
- **THEN** system returns HTTP 404 Not Found with message "Product not found"

#### Scenario: Stock check is deferred
- **WHEN** user adds product to cart
- **THEN** system does NOT validate current inventory stock level
- **THEN** stock validation is deferred to checkout process
- **THEN** rationale: cart is "intent to purchase", not a "reservation"

#### Scenario: Multiple users can add same product
- **WHEN** user A adds product X to their cart
- **WHEN** user B adds product X to their cart
- **THEN** both carts include product X (inventory is NOT decremented)
- **THEN** conflict resolution happens at checkout (first to checkout wins)

---

## Data Model

**CartItem Entity** (PostgreSQL table `cart_items`):

```
id              SERIAL PRIMARY KEY
cart_id         INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE
product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT
quantity        INTEGER NOT NULL CHECK (quantity > 0)
unit_price      NUMERIC(10, 2) NOT NULL
created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

UNIQUE (cart_id, product_id)  -- One product per cart
INDEXES:
  idx_cart_items_cart_id (cart_id)
  idx_cart_items_product_id (product_id)
```

**Response Model** (CartItemResponse in API):

```json
{
  "id": 5001,
  "cart_id": 123,
  "product_id": 456,
  "product_name": "Organic Tomatoes",
  "unit_price": "4.99",
  "quantity": 2,
  "subtotal": "9.98",
  "created_at": "2026-05-08T10:00:00Z",
  "updated_at": "2026-05-08T10:15:00Z"
}
```

---

## Endpoint Summary

| Method | Path | Purpose | Auth Required | Status Codes |
|--------|------|---------|---------------|-------------|
| POST | `/api/v1/carts/{cart_id}/items` | Add product to cart | Yes | 200/201/401/403/404/409/422 |
| PATCH | `/api/v1/carts/{cart_id}/items/{item_id}` | Update item quantity | Yes | 200/401/403/404/409/422 |
| DELETE | `/api/v1/carts/{cart_id}/items/{item_id}` | Remove item | Yes | 204/401/403/404/409 |
| DELETE | `/api/v1/carts/{cart_id}/items` | Clear all items | Yes | 204/401/403/404/409 |
| POST | `/api/v1/carts/{cart_id}/clear` | Clear all items (alt) | Yes | 204/401/403/404/409 |

---

## Error Handling

| Error | HTTP Code | Message | When |
|-------|-----------|---------|------|
| Unauthorized | 401 | "Authentication required" | No JWT token |
| Forbidden | 403 | "Cannot access this cart" | User owns different cart |
| Not Found | 404 | "Cart not found" \| "Product not found" \| "Item not found" | Resource missing |
| Unprocessable Entity | 422 | "Quantity must be between 1 and 999" | Invalid quantity |
| Conflict | 409 | "Product not available" \| "Cannot modify checked out cart" | Business logic violation |

---

## Validation Rules

- `product_id` must reference an existing, active product (for add operations)
- `quantity` must be an integer between 1 and 999 (inclusive)
- `unit_price` must be non-negative NUMERIC(10,2)
- Only one CartItem per product per cart (UNIQUE constraint enforced)
- CartItems cannot be modified if cart status is `"checked_out"`
- User can only modify items in their own cart (authorization check)

