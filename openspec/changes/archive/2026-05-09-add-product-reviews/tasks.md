## 1. Database — ORM Model + Migration

- [x] 1.1 Create `backend/app/models/review.py` with SQLAlchemy Review model (product_id, user_id, rating, title, comment, is_approved, rejection_reason, moderated_by, moderated_at, created_at, updated_at) with FKs, unique constraint on (product_id, user_id), and indexes
- [x] 1.2 Create Alembic migration `add_reviews_table` with the reviews table, indexes, and foreign keys
- [x] 1.3 Run migration to verify it applies cleanly

## 2. Backend — Pydantic Schemas

- [x] 2.1 Create `backend/app/schemas/review.py` with: ReviewCreate (product_id, rating, title?, comment?), ReviewUpdate (rating?, title?, comment?), ReviewResponse (id, product_id, user_id, rating, title, comment, is_approved, created_at, updated_at + user name), ReviewModeration (action: approve|reject, rejection_reason?), ReviewSummary (average_rating, total_count, distribution: dict[int, int]), ReviewListResponse (reviews[], total, page, per_page, average_rating, total_reviews)

## 3. Backend — Service Layer

- [x] 3.1 Create `backend/app/services/review_service.py` with: create_review (check product exists, check no duplicate, create with is_approved=false), get_product_reviews (paginated, optionally include pending for admin), get_review_by_id, update_review (owner check, reset moderation), delete_review (owner check), moderate_review (approve/reject with moderator tracking), get_review_summary (average + distribution via SQL aggregation), get_recent_reviews

## 4. Backend — Public Routes

- [x] 4.1 Create `backend/app/routes/reviews.py` with: POST /api/reviews/ (auth required, create), GET /api/products/{id}/reviews (public, paginated), PUT /api/reviews/{id} (owner only), DELETE /api/reviews/{id} (owner only), GET /api/reviews/recent (public)
- [x] 4.2 Modify `backend/app/routes/products.py` GET /api/products/{id} to include review summary (average_rating, total_count, distribution)

## 5. Backend — Admin Routes

- [x] 5.1 Create `backend/app/routes/admin_reviews.py` with: GET /api/admin/reviews/pending (list all pending), PATCH /api/admin/reviews/{id}/moderate (approve/reject), DELETE /api/admin/reviews/{id} (delete any review)

## 6. Backend — Register Routes

- [x] 6.1 Register review router and admin review router in `backend/app/main.py`

## 7. Backend — Tests

- [x] 7.1 Write tests for review creation (success, unauthenticated, duplicate, invalid rating, non-existent product)
- [x] 7.2 Write tests for reading reviews (paginated, empty product, admin sees pending)
- [x] 7.3 Write tests for updating and deleting own review
- [x] 7.4 Write tests for admin moderation (approve, reject, non-admin forbidden)
- [x] 7.5 Write tests for review summary in product detail endpoint

## 8. Frontend — Types + API Client

- [x] 8.1 Create `frontend/src/types/review.ts` with Review, ReviewSummary, ReviewCreate, ReviewUpdate interfaces
- [x] 8.2 Create `frontend/src/api/reviewApi.ts` with functions: getProductReviews, createReview, updateReview, deleteReview, getRecentReviews, moderateReview

## 9. Frontend — Hooks

- [x] 9.1 Create `frontend/src/hooks/useReviews.ts` with hooks: useProductReviews(productId, page), useCreateReview(), useUpdateReview(), useDeleteReview(), useRecentReviews(limit)

## 10. Frontend — Components

- [x] 10.1 Create `frontend/src/components/reviews/StarRating.tsx` — presentational, supports display mode (read-only stars) and interactive mode (clickable stars), uses lucide Star icons with Tailwind colors
- [x] 10.2 Create `frontend/src/components/reviews/ReviewCard.tsx` — displays user name, StarRating, title, comment, relative date
- [x] 10.3 Create `frontend/src/components/reviews/ReviewList.tsx` — summary header (average stars + total count), paginated list of ReviewCards, loading skeleton, empty state
- [x] 10.4 Create `frontend/src/components/reviews/ReviewForm.tsx` — interactive StarRating, title input, comment textarea, submit button, validation

## 11. Frontend — ProductDetailPage Integration

- [x] 11.1 Add review section to ProductDetailPage (ReviewList for display + ReviewForm for authenticated users)
- [x] 11.2 Add "Write a Review" button/area that shows ReviewForm when clicked
- [x] 11.3 Add star rating summary near the product title/price area

## 12. TypeScript Compilation + Build

- [x] 12.1 TypeScript compilation passes with no errors
- [x] 12.2 Vite production build succeeds
