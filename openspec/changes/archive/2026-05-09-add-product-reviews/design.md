## Context

Food Store has a complete product catalog system (CRUD, categories, inventory, search, filtering) but no review or rating functionality. Customers cannot see social proof or share feedback about products. The system already has:

- JWT authentication with `get_current_user` and `get_admin_user` dependencies
- Product CRUD with detail endpoint returning full product data
- Alembic migrations configured and working
- Admin dashboard UI ready for moderation features
- Frontend with React 18, TypeScript, Tailwind v4, and lucide icons

## Goals / Non-Goals

**Goals:**
- Database model for reviews with product_id, user_id, rating (1-5), title, comment, moderation fields
- Public API: create, read, update, delete own reviews with pagination and aggregation
- Admin API: moderate (approve/reject), delete any review
- Review summary (avg rating, distribution) included in product detail response
- Frontend: star rating display, review list, review form, moderation panel
- Full test coverage for backend endpoints

**Non-Goals:**
- Photo/video attachments on reviews (future enhancement)
- Verified purchase check (requires order system integration — deferred)
- Upvote/downvote or "helpful" marking on reviews
- Review editing history or versioning
- Machine learning sentiment analysis or spam detection
- Email notifications for review responses

## Decisions

### 1. Separate `reviews` table vs embedding in products
**Decision**: Separate table with FK to both products and users.

**Rationale**: Reviews are a distinct entity with their own lifecycle (creation → moderation → display). Embedding in a JSON column on products would prevent efficient querying, sorting, admin filtering, and pagination. A separate table follows the existing pattern (orders, carts all use separate tables).

**Alternatives considered**: JSONB column on products — rejected because it prevents indexing on rating, user_id queries, and efficient moderation workflows.

### 2. One review per user per product
**Decision**: Unique constraint on (product_id, user_id).

**Rationale**: Simplifies the model and prevents review spam. Users can update their existing review instead of creating multiple. This is the standard approach used by Amazon, Yelp, and most review platforms.

### 3. Moderation-first approach
**Decision**: All new reviews default to `is_approved: false`. Only approved reviews visible to regular users.

**Rationale**: In a food/restaurant context, review quality and trust are critical. A moderation-first approach prevents inappropriate content from appearing publicly. Admins can approve/reject from a dedicated admin UI. This can be relaxed later (e.g., auto-approve for verified purchasers).

### 4. Review summary included in product detail
**Decision**: Product detail endpoint includes computed review aggregation (avg rating, count, distribution by star).

**Rationale**: Avoiding N+1 queries. Clients (frontend) need this data on the product detail page to display the star summary. Computing it in the API layer via a single aggregation query is more efficient than making a separate API call.

**Trade-off**: Slightly larger product response payload. Mitigated by keeping the summary compact (4 numeric fields + 5 counts).

### 5. Admin moderation as separate endpoints vs unified review management
**Decision**: Separate `/api/admin/reviews/` endpoints for moderation actions.

**Rationale**: Clear separation of concerns. Regular users have CRUD on their own reviews via `/api/reviews/`. Admins have additional privileges via `/api/admin/reviews/`. This follows the existing pattern in the codebase (admin vs user endpoints).

### 6. Frontend: StarRating as reusable presentational component
**Decision**: StarRating component that accepts `rating` (number) and `maxRating` props, renders SVG stars. Supports both display (read-only) and interactive (click-to-rate) modes.

**Rationale**: Reusable across product cards, review list, review form, and potentially elsewhere. SVG stars with Tailwind classes are lightweight and avoid external icon dependencies beyond lucide.

## Data Model

### reviews table

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, auto-increment | |
| product_id | Integer | FK → products.id, NOT NULL, INDEX | Cascade delete |
| user_id | Integer | FK → users.id, NOT NULL, INDEX | Cascade delete |
| rating | SmallInteger | NOT NULL, CHECK(1-5) | |
| title | String(200) | NULLABLE | |
| comment | Text | NULLABLE | |
| is_approved | Boolean | NOT NULL, DEFAULT false, INDEX | For admin filtering |
| rejection_reason | String(500) | NULLABLE | Set when rejected |
| moderated_by | Integer | FK → users.id, NULLABLE | Admin who moderated |
| moderated_at | DateTime(tz) | NULLABLE | When moderated |
| created_at | DateTime(tz) | NOT NULL | Via TimestampMixin |
| updated_at | DateTime(tz) | NOT NULL | Via TimestampMixin |

**Indexes:**
- `idx_reviews_product_id` on product_id (for product review listing)
- `idx_reviews_user_id` on user_id (for user's own reviews query)
- `idx_reviews_is_approved` on is_approved (for filtering approved only)
- `uq_reviews_product_user` UNIQUE on (product_id, user_id)

**Relationships:**
- Review → Product: Many-to-One (cascade delete)
- Review → User: Many-to-One (cascade delete)
- Review → Moderator: Many-to-One (SET NULL on delete)

## API Changes

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/reviews/` | User | Create review |
| GET | `/api/products/{id}/reviews` | Public | List approved reviews for product |
| PUT | `/api/reviews/{id}` | Owner | Update own review |
| DELETE | `/api/reviews/{id}` | Owner | Delete own review |
| GET | `/api/reviews/recent` | Public | Recent reviews across all products |
| PATCH | `/api/admin/reviews/{id}/moderate` | Admin | Approve/reject review |
| DELETE | `/api/admin/reviews/{id}` | Admin | Delete any review |

### Modified endpoints

| Method | Path | Change |
|--------|------|--------|
| GET | `/api/products/{id}` | Response includes `reviews` object with `average_rating`, `total_count`, `distribution` |

### Frontend Components

- **`StarRating`** — Display/interactive star rating component (5 stars, SVG)
- **`ReviewCard`** — Single review display with user info, rating stars, title, comment, date
- **`ReviewList`** — Paginated list of ReviewCards with summary header
- **`ReviewForm`** — Star rating selector + title + comment inputs for creating/editing
- **`ModerationPanel`** — Admin table of pending reviews with approve/reject actions

### Hooks

- **`useProductReviews(productId)`** — fetch reviews for a product with pagination
- **`useCreateReview()`** — mutation to create a review
- **`useUpdateReview()`** — mutation to update own review
- **`useDeleteReview()`** — mutation to delete own review
- **`useModerateReview()`** — admin mutation to approve/reject
- **`useRecentReviews(limit)`** — fetch recent reviews

### Backend Structure

| File | Purpose |
|------|---------|
| `backend/app/models/review.py` | SQLAlchemy Review model |
| `backend/app/schemas/review.py` | Pydantic v2 request/response schemas |
| `backend/app/routes/reviews.py` | Public review endpoints |
| `backend/app/routes/admin_reviews.py` | Admin moderation endpoints |
| `backend/app/services/review_service.py` | Business logic layer |
| `backend/migrations/versions/..._add_reviews_table.py` | Alembic migration |
| `backend/tests/test_reviews.py` | Test suite |

## Implementation Order

1. **Database**: ORM model + Alembic migration
2. **Backend schemas**: Pydantic models for request/response
3. **Backend service**: Business logic with aggregation queries
4. **Backend routes**: Public + admin endpoints
5. **Register router** in `main.py`
6. **Backend tests**: Unit + integration
7. **Frontend types + API**: TypeScript interfaces + API client
8. **Frontend hooks**: Data fetching and mutations
9. **Frontend components**: StarRating, ReviewCard, ReviewList, ReviewForm
10. **ProductDetailPage**: Integrate review section
11. **Admin moderation page**: (optional, can be basic)
12. **E2E integration**: Polish and verify

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Review spam or inappropriate content | Moderation-first approach (all reviews default to pending). Admin approval required before public visibility. |
| Performance impact on product detail endpoint | Single aggregation query per product. Index on product_id and is_approved. Distribution computed in-database with COUNT + GROUP BY. |
| Orphaned reviews on product/user deletion | Cascade delete on both FKs. When a product is deleted, its reviews go with it. |
| Users abusing the "one review per product" rule | Enforced at DB level with unique constraint. Users can update their review instead. |
| Migration conflicts with existing data | Alembic migration is additive only (new table). No existing data migration needed. |
