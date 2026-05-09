## Why

Customers want to save products they're interested in for later purchase. Currently there's no way to bookmark or save favorites — users must remember product names or search again. Adding a wishlist/favorites feature improves the shopping experience, increases return visits, and provides data on customer preferences.

## What Changes

- **New `wishlist_items` database table**: stores user_id, product_id, and created_at
- **New API endpoints**: add/remove/list/check wishlist items
- **Frontend "Favorite" button**: heart icon toggle on ProductCard and ProductDetailPage
- **Wishlist page**: dedicated page listing all saved products with remove option
- **Wishlist badge**: show count in navigation

## Capabilities

### New Capabilities

- `wishlist`: Save and manage favorite products — add, remove, list, and check wishlist items. Simple toggle-based interaction with heart icon.

### Modified Capabilities

None — standalone new feature.

## Impact

- **`backend/app/models/wishlist.py`**: New ORM model (wishlist_items: user_id, product_id, created_at + unique constraint)
- **`backend/app/schemas/wishlist.py`**: Pydantic v2 schemas (WishlistItemResponse, WishlistCheck)
- **`backend/app/routes/wishlist.py`**: API endpoints — POST toggle, GET list, GET check
- **`backend/app/services/wishlist_service.py`**: Business logic for wishlist operations
- **`backend/app/main.py`**: Register new wishlist router
- **`backend/alembic/versions/`**: New migration for wishlist_items table
- **`frontend/src/types/wishlist.ts`**: TypeScript interfaces
- **`frontend/src/api/wishlistApi.ts`**: API client functions
- **`frontend/src/hooks/useWishlist.ts`**: Custom hook with toggle, list, check, count
- **`frontend/src/components/wishlist/FavoriteButton.tsx`**: Heart icon toggle button
- **`frontend/src/pages/WishlistPage.tsx`**: Wishlist page with product grid
- **`frontend/src/components/layout/Navigation.tsx` / Topbar**: Add wishlist badge
- **`frontend/src/App.tsx`**: Add wishlist route
- **`frontend/src/components/ProductCard.tsx`**: Add favorite button
- **`frontend/src/pages/ProductDetailPage.tsx`**: Add favorite button
- **Backend tests** in `backend/tests/`: tests for wishlist endpoints
