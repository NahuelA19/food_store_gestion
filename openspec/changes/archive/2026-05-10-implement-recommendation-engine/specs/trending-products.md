# Trending Products

## Requirements

### REQ-TREND-01: Scoring Formula
- Score = (purchase_count × 0.6) + (avg_rating × 0.4)
- Only products with `is_available = true`
- Only orders with status in (`paid`, `confirmed`, `shipped`, `delivered`)

### REQ-TREND-02: Response Format
- Returns `ProductResponse` with extra fields: `avg_rating: float`, `purchase_count: int`
- Ordered by score descending
- Limit: 8 products default, configurable via `?limit=`

### REQ-TREND-03: Caching
- Results cached in-memory for 5 minutes (TTL)
- Cache key: `trending:{limit}`
- On cache miss, recompute from DB
