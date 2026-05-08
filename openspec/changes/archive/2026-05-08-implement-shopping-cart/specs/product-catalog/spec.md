# Spec: Product Catalog (Modified for Shopping Cart)

**Status**: Approved  
**Version**: 1.1  
**Owner**: Backend Team

---

## Overview

This spec documents MODIFIED requirements for the Product Catalog to support shopping cart integration. Product endpoints now include cart-relevant metadata: availability for purchase, stock status, and add-to-cart readiness. These fields provide the frontend with information needed to render "Add to Cart" buttons and availability warnings.

---

## MODIFIED Requirements

### Requirement: Product Details with Cart Support

The system SHALL return product details including cart-relevant fields: `id`, `name`, `description`, `price`, `category_id`, `available_for_cart` (boolean), `stock_count`, `low_stock_threshold`, `image_urls`, `created_at`, `updated_at`.

The `available_for_cart` field indicates whether a product can be added to a shopping cart (active + in stock).

#### Scenario: Product available for purchase
- **WHEN** product has `is_active=true` and `stock_count > 0`
- **WHEN** user calls GET `/api/v1/products/{product_id}`
- **THEN** response includes `available_for_cart: true`
- **THEN** frontend displays "Add to Cart" button enabled
- **THEN** user can successfully add product to cart

#### Scenario: Product out of stock
- **WHEN** product has `is_active=true` but `stock_count = 0`
- **WHEN** user calls GET `/api/v1/products/{product_id}`
- **THEN** response includes `available_for_cart: false`
- **THEN** frontend displays "Add to Cart" button disabled with "Out of Stock" label
- **THEN** user cannot add product to cart (API rejects with 409)

#### Scenario: Product inactive
- **WHEN** product has `is_active=false`
- **WHEN** user calls GET `/api/v1/products/{product_id}`
- **THEN** response includes `available_for_cart: false`
- **THEN** frontend displays "Product unavailable" message
- **THEN** user cannot add product to cart (API rejects with 409)

#### Scenario: Low stock warning
- **WHEN** product has `stock_count > 0` but `stock_count <= low_stock_threshold`
- **WHEN** user calls GET `/api/v1/products/{product_id}`
- **THEN** response includes `available_for_cart: true` (still purchasable)
- **THEN** response includes stock count information
- **THEN** frontend can display "Only 3 left!" type warning

#### Scenario: Product list endpoint includes availability
- **WHEN** user calls GET `/api/v1/products` (list endpoint with pagination)
- **THEN** each item in response includes `available_for_cart` flag
- **THEN** frontend can show disabled "Add to Cart" buttons for unavailable products

### Requirement: Product Availability Status in Cart Context

When a product is in a user's cart, the product's availability is tracked at cart display time. If product status changes after being added to cart, the cart notes the discrepancy for checkout validation.

#### Scenario: Product active when added to cart, changes later
- **WHEN** user adds product to cart while `is_active=true`
- **WHEN** admin later sets `is_active=false`
- **WHEN** user views their cart (GET `/api/v1/carts`)
- **THEN** cart still displays the item
- **THEN** cart item includes note: `availability_issue: true`, `reason: "Product no longer available"`
- **THEN** frontend can display warning badge on item

#### Scenario: Product stock level affects cart display
- **WHEN** product is in user's cart with quantity=5
- **WHEN** product stock drops below cart quantity (e.g., stock=2)
- **WHEN** user views cart
- **THEN** cart item includes `stock_warning: true`
- **THEN** frontend displays "Only 2 in stock; your cart has 5" type warning
- **THEN** checkout validation will fail with details

#### Scenario: Checkout rejects unavailable items
- **WHEN** user attempts checkout with unavailable products
- **WHEN** product either inactive or out of stock
- **THEN** POST `/api/v1/carts/{cart_id}/checkout` returns 400 Bad Request
- **THEN** response includes details: which items are unavailable and why

### Requirement: Stock Count and Inventory Context

Product endpoints include stock count and low-stock threshold. Stock count is informational for cart and checkout; inventory is NOT decremented by cart operations (only at checkout).

#### Scenario: Stock count is current at time of request
- **WHEN** user calls GET `/api/v1/products/{product_id}`
- **THEN** response includes `stock_count: 50` (current actual count)
- **THEN** stock count reflects real-time inventory
- **THEN** multiple concurrent requests see consistent snapshot

#### Scenario: Low stock threshold is configurable per product
- **WHEN** product has `low_stock_threshold: 10`
- **WHEN** `stock_count: 12`
- **THEN** response indicates `stock_level: "low"` (or similar)
- **THEN** frontend can highlight product with "Few left in stock" warning

#### Scenario: Stock is not reserved by cart items
- **WHEN** product has `stock_count: 5`
- **WHEN** user A adds 3 to cart, user B adds 2 to cart
- **THEN** product still shows `stock_count: 5` (unchanged)
- **THEN** cart items are "intent", not "reservations"
- **THEN** if both users checkout, only one succeeds (handled at checkout validation)

### Requirement: Product Response Includes Cart Metadata

All product responses (single product, product list, search results) include cart-relevant fields. This enables consistent frontend rendering across all product views.

#### Scenario: Single product endpoint
- **WHEN** user calls GET `/api/v1/products/456`
- **THEN** response includes: `id`, `name`, `price`, `available_for_cart`, `stock_count`, `low_stock_threshold`, `image_urls`

#### Scenario: Product list endpoint
- **WHEN** user calls GET `/api/v1/products?category=1&page=1&limit=20`
- **THEN** each product in `items[]` includes: `available_for_cart`, `stock_count`
- **THEN** no performance penalty (fields already in database join)

#### Scenario: Product search endpoint
- **WHEN** user calls GET `/api/v1/products/search?q=tomato`
- **THEN** search results include same fields as list endpoint
- **THEN** `available_for_cart` flag correctly reflects current status

#### Scenario: Related products endpoint
- **WHEN** user calls GET `/api/v1/products/{product_id}/related`
- **THEN** related products include `available_for_cart` flag
- **THEN** frontend can show "Add to Cart" buttons for related items

### Requirement: Product Filtering by Availability

Product list and search endpoints support filtering by availability. This allows users or frontend to show only purchasable products.

#### Scenario: Filter by availability
- **WHEN** user calls GET `/api/v1/products?available=true`
- **THEN** response only includes products with `available_for_cart=true`
- **THEN** out-of-stock and inactive products are excluded

#### Scenario: Filter by stock status
- **WHEN** user calls GET `/api/v1/products?in_stock=true`
- **THEN** response includes only products with `stock_count > 0`
- **THEN** inactive products are still excluded (separate parameter)

#### Scenario: Filter by active status
- **WHEN** user calls GET `/api/v1/products?is_active=true`
- **THEN** response includes only active products (regardless of stock)
- **THEN** this is useful for admin workflows

---

## Data Model Extension

**Product Entity** (no schema changes — fields already exist):

```sql
-- Existing fields (no changes needed)
id              SERIAL PRIMARY KEY
name            VARCHAR(255) NOT NULL
description     TEXT
price           NUMERIC(10, 2) NOT NULL
category_id     INTEGER NOT NULL REFERENCES categories(id)
is_active       BOOLEAN NOT NULL DEFAULT true
image_urls      JSON NULLABLE
created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

-- Inventory fields (already exist in separate table or as columns)
stock_count     INTEGER NOT NULL DEFAULT 0
low_stock_threshold  INTEGER DEFAULT 10

-- No new fields needed; only response logic changes
```

**Response Model** (ProductResponse in API — extended):

```json
{
  "id": 456,
  "name": "Organic Tomatoes",
  "description": "Fresh organic tomatoes from local farm",
  "price": "4.99",
  "category_id": 1,
  "category_name": "Vegetables",
  "is_active": true,
  "available_for_cart": true,
  "stock_count": 45,
  "low_stock_threshold": 10,
  "stock_level": "normal",
  "image_urls": [
    "https://api.example.com/images/tomatoes-1.jpg",
    "https://api.example.com/images/tomatoes-2.jpg"
  ],
  "created_at": "2026-05-01T10:00:00Z",
  "updated_at": "2026-05-08T09:30:00Z"
}
```

**Cart Item Availability Context** (included in CartResponse when viewing cart):

```json
{
  "id": 5001,
  "product_id": 456,
  "product_name": "Organic Tomatoes",
  "unit_price": "4.99",
  "quantity": 2,
  "subtotal": "9.98",
  "availability_status": "available",
  "availability_issue": false,
  "stock_warning": false,
  "reason": null
}
```

If product becomes unavailable after being added to cart:

```json
{
  "id": 5001,
  "product_id": 456,
  "product_name": "Organic Tomatoes",
  "unit_price": "4.99",
  "quantity": 2,
  "subtotal": "9.98",
  "availability_status": "unavailable",
  "availability_issue": true,
  "stock_warning": false,
  "reason": "Product is no longer available"
}
```

---

## Endpoint Summary

| Method | Path | Purpose | Query Params | Response Includes |
|--------|------|---------|--------------|-------------------|
| GET | `/api/v1/products` | List products | page, limit, category, available, in_stock, sort, order | available_for_cart, stock_count |
| GET | `/api/v1/products/{id}` | Get product details | - | available_for_cart, stock_count |
| GET | `/api/v1/products/search` | Search products | q, available, in_stock | available_for_cart, stock_count |
| GET | `/api/v1/products/{id}/related` | Get related products | - | available_for_cart, stock_count |

---

## Validation Rules

- `available_for_cart` is computed from: `is_active=true AND stock_count > 0`
- `stock_count` must be >= 0
- `low_stock_threshold` must be > 0 and <= stock_count
- `stock_level` is computed from: stock_count <= low_stock_threshold ? "low" : "normal"
- Product price cannot be negative
- All products in response must have consistent availability data (no race conditions)

---

## Performance Considerations

- `available_for_cart` is computed at query time (no new database field)
- Stock count is already indexed for filtering queries
- Response latency should be identical to previous version (no new joins required)
- Recommend caching product list responses (cache invalidates on inventory updates)

---

## Backward Compatibility

- All new fields are additions; existing fields unchanged
- Existing API clients can safely ignore `available_for_cart`, `stock_count`, `stock_level`
- No breaking changes; clients can upgrade gradually
- Optional filtering parameters are backward compatible (omitting them returns all products)

