## 1. Database — ORM Model + Migration

- [ ] 1.1 Create `backend/app/models/wishlist.py` with WishlistItem model (user_id, product_id, created_at) with FKs, unique constraint on (user_id, product_id), and index on user_id
- [ ] 1.2 Add WishlistItem to `backend/app/models/__init__.py`
- [ ] 1.3 Create Alembic migration for wishlist_items table

## 2. Backend — Schemas + Service + Routes

- [ ] 2.1 Create `backend/app/schemas/wishlist.py` with WishlistItemResponse (id, product_id, created_at + nested ProductResponse), WishlistToggleResponse (is_wishlisted: bool)
- [ ] 2.2 Create `backend/app/services/wishlist_service.py` with: toggle_wishlist (add/remove, return state), get_wishlist (list with product details), check_wishlist (map of product_id → bool)
- [ ] 2.3 Create `backend/app/routes/wishlist.py` with: POST /api/wishlist/toggle/{product_id}, GET /api/wishlist/, GET /api/wishlist/check
- [ ] 2.4 Register wishlist router in `backend/app/main.py`

## 3. Backend — Tests

- [ ] 3.1 Write tests for toggle (add, remove, unauthenticated, non-existent product)
- [ ] 3.2 Write tests for list (with items, empty, unauthenticated)
- [ ] 3.3 Write tests for check (single, multiple, product not in wishlist)

## 4. Frontend — Types + API + Hooks

- [ ] 4.1 Create `frontend/src/types/wishlist.ts` with WishlistItem interface
- [ ] 4.2 Create `frontend/src/api/wishlistApi.ts` with toggle, list, check functions
- [ ] 4.3 Create `frontend/src/hooks/useWishlist.ts` with useWishlist hook (items, count, toggle, isWishlisted, isLoading, refresh)

## 5. Frontend — Components + Pages

- [ ] 5.1 Create `frontend/src/components/wishlist/FavoriteButton.tsx` with heart icon toggle (lucide Heart), fill animation, loading state
- [ ] 5.2 Create `frontend/src/pages/WishlistPage.tsx` with product grid, empty state "No favorites yet", loading skeleton

## 6. Frontend — Integration

- [ ] 6.1 Add FavoriteButton to ProductCard (top-right corner of card)
- [ ] 6.2 Add FavoriteButton to ProductDetailPage
- [ ] 6.3 Add wishlist icon with badge to Topbar navigation (next to cart)
- [ ] 6.4 Add route `/wishlist` in App.tsx
- [ ] 6.5 TypeScript compilation passes with no errors
- [ ] 6.6 Vite production build succeeds
