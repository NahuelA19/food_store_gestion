## Context

Food Store has reviews (ratings 1-5), order_items (purchase co-occurrence), wishlists, and categories — all sitting in PostgreSQL unused for recommendations. The current "related products" on ProductDetailPage is a trivial same-category query with zero personalization.

## Goals / Non-Goals

**Goals:**
- Multi-strategy recommendation engine with 3 strategies: market basket (frequently bought together), top-rated/popular, and personalized (user purchase history)
- New API endpoints that compose strategies
- Frontend sections: "Frequently Bought Together" (ProductDetailPage), "Recommended for You" (HomePage), "Trending Now" (ProductsPage)
- All computed via SQL queries — no ML libraries, no external services

**Non-Goals:**
- Real-time personalization (30s-5min cache is fine for a food store)
- Vector embeddings or ML models
- A/B testing framework
- Admin dashboard for recommendations

## Decisions

1. **SQL-based computation over ML libraries**: PostgreSQL has all the data; aggregation queries (co-occurrence counts, avg ratings, order frequency) are sufficient for a food store. No scikit-learn, no Redis, no external deps.
2. **Strategy pattern**: `RecommendationService` with pluggable strategies (`FrequentlyBoughtTogetherStrategy`, `PopularStrategy`, `PersonalizedStrategy`). Easy to add more later.
3. **Server-side in-memory cache (dict + TTL)**: Results change infrequently (new orders happen, but not minutely). A simple `@lru_cache`-style dict with 5-minute TTL avoids hammering the DB on every page load. If performance becomes an issue later, swap for Redis.
4. **Reuse `ProductResponse` schema**: No new Pydantic models needed — all endpoints return `list[ProductResponse]`.
5. **Fallback chain**: If a strategy returns < 4 products, fill with same-category products (the existing fallback). Never return empty.

## Risks / Trade-offs

- **Cache staleness**: A product bought 2 minutes ago won't appear in "frequently bought together" for up to 5 min. → Acceptable for a food store; user perception of "trending" doesn't need real-time.
- **Cold start**: New users with no orders get same-category fallback (same as today). No worse than current behavior.
- **Performance on large datasets**: The co-occurrence query does a self-join on `order_items`. At thousands of orders it's fine; at millions we'd need materialized views. → Monitor, optimize later.
