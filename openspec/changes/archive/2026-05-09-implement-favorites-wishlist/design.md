## Context

Food Store has a complete product catalog, auth, and shopping cart. Users can browse and search products but cannot save favorites for later. The project already has:

- JWT authentication with `get_current_user` dependency
- Product API with detail and listing endpoints
- Frontend with ProductCard, ProductDetailPage, Navigation
- Alembic migrations configured
- Consistent async SQLAlchemy patterns

## Goals / Non-Goals

**Goals:**
- Wishlist toggle: add/remove products with a single endpoint (toggle)
- Wishlist list: get all saved products for current user
- Wishlist check: check if a product is wishlisted (for UI heart state)
- FavoriteButton component reusable on ProductCard and ProductDetailPage
- WishlistPage showing saved products in a grid
- Wishlist count badge in Topbar navigation
- Full test coverage for backend endpoints

**Non-Goals:**
- Wishlist sharing or public wishlists
- Multiple wishlists (single default wishlist only)
- Notifications for price changes on wishlist items
- Guest/anonymous wishlist (user must be authenticated)
- Product recommendations based on wishlist data

## Decisions

### 1. Toggle endpoint vs separate add/remove
**Decision**: Single `POST /api/wishlist/toggle/{product_id}` endpoint that adds if not present, removes if present. Returns `{ is_wishlisted: bool }`.

**Rationale**: Simpler frontend logic — no need to track state to decide whether to call add or remove. The frontend just calls toggle and reads the result.

### 2. Unique constraint on (user_id, product_id)
**Decision**: Enforced at DB level with unique constraint. Prevents duplicates without application-level checks.

**Rationale**: Standard pattern matching the review system's approach. Fast, reliable, and simple.

### 3. Wishlist badge shown in Topbar
**Decision**: Nav shows a heart icon with item count badge next to the cart icon.

**Rationale**: Consistent with existing cart badge pattern. Users expect to see wishlist count in the navigation area.

### 4. Single endpoint for checking wishlist status
**Decision**: `GET /api/wishlist/check?product_ids=1,2,3` returns a map of `{ product_id: bool }`.

**Rationale**: Allows checking multiple products at once (useful for product listing pages) instead of one request per product.

## Data Model

### wishlist_items table

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, auto-increment | |
| user_id | Integer | FK → users.id, NOT NULL, INDEX | Cascade delete |
| product_id | Integer | FK → products.id, NOT NULL, INDEX | Cascade delete |
| created_at | DateTime(tz) | NOT NULL | Via TimestampMixin |

**Indexes:**
- `uq_wishlist_user_product` UNIQUE on (user_id, product_id)
- `ix_wishlist_user_id` on user_id (for user's wishlist queries)

## API Changes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/wishlist/toggle/{product_id}` | User | Toggle product in wishlist |
| GET | `/api/wishlist/` | User | List all wishlisted products |
| GET | `/api/wishlist/check` | User | Check wishlist status for product IDs |

### Frontend Components

- **`FavoriteButton`** — Heart icon toggle, receives `isWishlisted` and `onToggle` props. Uses lucide `Heart` icon with fill animation.
- **`WishlistPage`** — Grid of ProductCard with remove option, empty state, loading state.
- **Topbar/Nav update** — Heart icon with badge showing wishlist count.

### Hooks

- **`useWishlist()`** — Returns: items (products), count, isLoading, toggle (fn), isWishlisted (productId → bool), refresh (fn)

## Implementation Order

1. Database: ORM model + migration
2. Backend: schemas, service, routes
3. Register router in main.py
4. Backend tests
5. Frontend: types, API client, hooks
6. Frontend: FavoriteButton component
7. Frontend: WishlistPage
8. Integrate: ProductCard, ProductDetailPage, Topbar badge, App.tsx route

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Performance on product list with many items | Check endpoint accepts up to 50 IDs per call. Paginate checks if needed. |
| Heart icon state could be out of sync | Toggle returns current state; FavoriteButton reads prop, not local state. |
| Migration conflicts | New table only, no existing data changes. Safe additive migration. |
