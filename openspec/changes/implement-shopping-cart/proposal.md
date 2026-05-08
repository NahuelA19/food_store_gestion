## Why

The Food Store has established user authentication, product catalog with advanced search and filtering, and inventory management. Users can now browse and discover products, but have no way to collect items for purchase. Implementing a shopping cart is essential to enable the e-commerce workflow and transition from browsing to checkout and order placement.

## What Changes

- **Backend**: Create shopping cart service with endpoints to add items, remove items, update quantities, and fetch cart contents. Add cart and cart_items tables to PostgreSQL. Cart persists for authenticated users and is tracked per session.
- **Frontend**: Add CartPage component to display cart contents, CartBadge component in header showing item count, and cart context/hooks to manage cart state across the app.
- **Database**: Two new tables (`carts` and `cart_items`) with foreign keys to `users` and `products`. Indexes on frequently queried fields.

## Capabilities

### New Capabilities

- `shopping-cart`: Core cart management—create/fetch carts, persist cart state in database for authenticated users, handle cart lifecycle (active carts, checkout transitions).
- `cart-items`: Cart item operations—add product to cart with quantity, remove items, update item quantities, validate items (product exists, is available).
- `cart-checkout`: Initiate checkout flow from cart, calculate cart totals, validate cart before checkout, prepare transition to order placement (deferred to Change 8).

### Modified Capabilities

- `user-service`: User model now maintains relationship to active cart; authentication now initializes or retrieves user's cart on login.
- `product-catalog`: Product endpoints now include availability checks in context of cart operations; product response includes cart-relevant metadata (stock status for cart context).

## Impact

### Database
- **New tables**: `carts` (id, user_id, created_at, updated_at, expires_at), `cart_items` (id, cart_id, product_id, quantity, unit_price, created_at, updated_at)
- **Indexes**: `carts.user_id`, `cart_items.cart_id`, `cart_items.product_id` for efficient queries

### Backend Routes (New)
- `GET /api/v1/cart` — Fetch current user's cart with all items
- `POST /api/v1/cart/items` — Add product to cart (request: product_id, quantity)
- `PATCH /api/v1/cart/items/{item_id}` — Update item quantity
- `DELETE /api/v1/cart/items/{item_id}` — Remove item from cart
- `POST /api/v1/cart/checkout` — Validate and prepare cart for checkout (deferred: payment)

### Frontend Components (New)
- **CartPage** (`frontend/src/pages/CartPage.tsx`) — Display full cart, edit quantities, remove items, show totals
- **CartBadge** (`frontend/src/components/CartBadge.tsx`) — Header component showing cart item count
- **CartContext** (`frontend/src/context/CartContext.tsx`) — Manage cart state globally, expose hooks for add/remove/update
- **useCart** hook (`frontend/src/hooks/useCart.ts`) — Custom hook for cart operations (fetch, add, remove, update)

### Navigation Impact
- **Header**: Add CartBadge component displaying item count, linking to CartPage
- **ProductPage**: Add "Add to Cart" button on product details
- **ProductsPage**: Add "Add to Cart" quick-add buttons in product list

## Implementation Sequence

1. Backend: Define models (Cart, CartItem) and create migrations
2. Backend: Implement service layer and routes
3. Backend: Add tests for cart endpoints
4. Frontend: Create CartContext and useCart hook
5. Frontend: Build CartPage component
6. Frontend: Add CartBadge and cart buttons throughout app
7. Frontend: Add tests for cart state management and UI
8. Integration testing and deployment
