## Why

The current "related products" feature only shows products in the same category — no personalization, no data-driven insights. Users have no discovery mechanism beyond manual browsing. With reviews, order history, and wishlist data already in the database, we can build a multi-strategy recommendation engine that increases discoverability, cross-sells, and average order value.

## What Changes

- **Backend recommendation service**: New `RecommendationService` with 3 strategies:
  - Market Basket Analysis: products frequently bought together (co-occurrence in orders)
  - Collaborative Filtering: user-based recommendations from order history
  - Popular/Top Rated: trending products by rating + purchase volume
- **New API endpoints**:
  - `GET /api/products/recommendations` — personalized for authenticated user
  - `GET /api/products/{id}/frequently-bought-together` — co-purchase products
  - `GET /api/products/trending` — popular products across the store
- **Frontend "Recommended for You"** section on the Home page (personalized)
- **Frontend "Frequently Bought Together"** section on ProductDetailPage
- **Frontend "Trending Now"** section on ProductsPage

## Capabilities

### New Capabilities
- `product-recommendations`: Algorithms and endpoints for personalized + data-driven product recommendations
- `trending-products`: Trending/popular products scoring based on reviews and purchase volume

### Modified Capabilities

None. The existing `related-products` logic (same-category) remains untouched as a fallback; no spec-level requirements change.

## Impact

- `backend/app/services/` — new `recommendation_service.py`
- `backend/app/routes/products.py` — new endpoints added to existing router
- `backend/app/schemas/` — no new schemas needed (reuses `ProductResponse`)
- `frontend/src/pages/HomePage.tsx` — add "Recommended for You" section
- `frontend/src/pages/ProductDetailPage.tsx` — replace current related-products grid with "Frequently Bought Together"
- `frontend/src/pages/ProductsPage.tsx` — add "Trending Now" section
- `frontend/src/hooks/` — new `useRecommendations.ts` hook
- `frontend/src/api/` — extend `productApi` with new endpoints
- No new dependencies. No database migrations needed (uses existing data).
