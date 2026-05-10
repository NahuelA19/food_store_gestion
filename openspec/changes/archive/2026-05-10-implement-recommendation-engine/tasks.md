## 1. Backend — Recommendation Service

- [ ] 1.1 Create `backend/app/services/recommendation_service.py` with in-memory TTL cache utility
- [ ] 1.2 Implement `FrequentlyBoughtTogetherStrategy` — SQL co-occurrence query on `order_items`
- [ ] 1.3 Implement `PopularStrategy` — weighted score (purchase_count × 0.6 + avg_rating × 0.4)
- [ ] 1.4 Implement `PersonalizedStrategy` — categories from user order history, exclude purchased products
- [ ] 1.5 Wire `RecommendationService` as a FastAPI dependency (singleton-like via `@lru_cache` on factory)

## 2. Backend — API Endpoints

- [ ] 2.1 Add `GET /api/products/recommendations` (personalized, auth-required, returns up to 8)
- [ ] 2.2 Add `GET /api/products/{id}/frequently-bought-together` (public, returns up to 4)
- [ ] 2.3 Add `GET /api/products/trending` (public, returns up to 8)
- [ ] 2.4 Add fallback chain: if strategy returns < limit, fill with same-category products
- [ ] 2.5 Add optional `avg_rating` and `purchase_count` fields to `ProductResponse` for trending

## 3. Frontend — API & Hooks

- [ ] 3.1 Extend `productApi` with `getRecommendations()`, `getFrequentlyBoughtTogether(id)`, `getTrending()`
- [ ] 3.2 Create `frontend/src/hooks/useRecommendations.ts` with `useRecommendations()`, `useFrequentlyBoughtTogether(id)`, `useTrending()`

## 4. Frontend — Components & Pages

- [ ] 4.1 ProductDetailPage: replace current `relatedProducts` section with "Frequently Bought Together"
- [ ] 4.2 HomePage: add "Recommended for You" section (or trending if not authenticated)
- [ ] 4.3 ProductsPage: add "Trending Now" section at top

## 5. Tests

- [ ] 5.1 Write backend tests for `RecommendationService` (mock DB queries, test each strategy)
- [ ] 5.2 Write backend tests for new endpoints (test responses, fallback, auth-guard on personalized)
- [ ] 5.3 Write frontend tests for hooks (mock API, test loading/error/data states)
