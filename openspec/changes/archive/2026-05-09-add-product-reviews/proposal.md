## Why

Food Store customers cannot currently see what others think about products — no ratings, no reviews, no comments. This reduces purchase confidence, trust, and conversion rates. Adding a review and rating system gives customers social proof, helps them make informed decisions, and provides the business with valuable product feedback.

## What Changes

- **New `reviews` database table**: stores product_id, user_id, rating (1-5), title, comment, moderation status, and timestamps
- **New API endpoints**: create/read/update/delete reviews, plus admin moderation endpoints (approve/reject)
- **Review display on ProductDetailPage**: star rating summary, review list with pagination, average rating
- **Review creation form**: authenticated users can submit a rating + review on any product
- **Admin moderation panel**: approve, reject, or delete reviews (integrated into existing admin dashboard)
- **Frontend components**: StarRating display, ReviewCard, ReviewForm, ReviewList, ModerationPanel

## Capabilities

### New Capabilities

- `product-reviews`: Review and rating system for products — create, read, moderate, and display reviews with 1-5 star ratings, title, and comment. Supports pagination, sorting, admin moderation, and average rating aggregation.

### Modified Capabilities

None — this is a new feature with no existing spec-level requirement changes.

## Impact

- **`backend/app/models/review.py`**: New ORM model for reviews (product_id, user_id, rating, title, comment, is_approved, moderated_by, moderated_at)
- **`backend/app/schemas/review.py`**: Pydantic v2 schemas for request/response (ReviewCreate, ReviewUpdate, ReviewResponse, ReviewModeration, ReviewSummary with avg rating)
- **`backend/app/routes/reviews.py`**: API endpoints — CRUD for reviews (authenticated), moderation endpoints (admin only)
- **`backend/app/services/review_service.py`**: Business logic for review creation, moderation, aggregation
- **`backend/app/main.py`**: Register new review router
- **`backend/migrations/`**: New Alembic migration for reviews table + indexes
- **`frontend/src/types/review.ts`**: TypeScript interfaces for Review, ReviewSummary
- **`frontend/src/api/reviewApi.ts`**: API client functions for reviews
- **`frontend/src/hooks/useReviews.ts`**: Custom hook for review data fetching and mutation
- **`frontend/src/components/reviews/`**: StarRating, ReviewCard, ReviewForm, ReviewList components
- **`frontend/src/pages/ProductDetailPage.tsx`**: Add review section (summary + list + form)
- **`frontend/src/pages/admin/`**: Optional moderation page for reviews
- **Backend tests** in `backend/tests/`: unit + integration tests for review endpoints
