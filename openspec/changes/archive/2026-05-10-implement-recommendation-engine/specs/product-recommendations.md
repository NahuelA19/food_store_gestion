# Product Recommendations

## Requirements

### REQ-REC-01: Frequently Bought Together
- `GET /api/products/{id}/frequently-bought-together?limit=4` returns products that co-occur in orders with the given product
- Co-occurrence = products appearing in the same order (any status except `payment_failed` and `cancelled`)
- Ordered by co-occurrence count descending
- Excludes the given product
- Falls back to same-category if < `limit` results

### REQ-REC-02: Personalized Recommendations
- `GET /api/products/recommendations` returns products recommended for the authenticated user
- Strategy: products from categories the user has ordered before, ordered by avg review rating desc, then purchase frequency
- Excludes products the user has already purchased
- Falls back to trending if user has no order history
- Limit: 8 products

### REQ-REC-03: Trending Products
- `GET /api/products/trending?limit=8` returns popular products
- Scoring: weighted combination of (purchase count × 0.6 + avg rating × 0.4)
- Includes `avg_rating` and `purchase_count` in the response
- Ordered by score descending
- Uses a 5-minute server-side cache

### REQ-REC-04: Fallback Chain
- If any strategy returns fewer results than requested, fill remaining slots with same-category products
- Never return an empty `data` array
