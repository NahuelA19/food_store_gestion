# product-reviews Specification

## Purpose
TBD - created by archiving change add-product-reviews. Update Purpose after archive.
## Requirements
### Requirement: Create product review
The system SHALL allow authenticated users to create a review for any available product with a numeric rating (1-5), an optional title, and an optional comment. New reviews SHALL default to unmoderated (pending approval) status.

#### Scenario: Authenticated user creates review with all fields
- **WHEN** an authenticated user POSTs to `/api/reviews/` with valid `product_id`, `rating: 4`, `title: "Great product"`, and `comment: "Really enjoyed this"`
- **THEN** the system SHALL create the review with `is_approved: false`, `moderated_by: null`, and return the review with HTTP 201

#### Scenario: Authenticated user creates review with minimum fields
- **WHEN** an authenticated user POSTs to `/api/reviews/` with valid `product_id` and `rating: 5`
- **THEN** the system SHALL create the review with empty title and comment, and return HTTP 201

#### Scenario: Unauthenticated user cannot create review
- **WHEN** an unauthenticated request POSTs to `/api/reviews/`
- **THEN** the system SHALL return HTTP 401 Unauthorized

#### Scenario: User creates review for non-existent product
- **WHEN** an authenticated user POSTs to `/api/reviews/` with a non-existent `product_id`
- **THEN** the system SHALL return HTTP 404 Not Found

#### Scenario: User creates duplicate review for same product
- **WHEN** an authenticated user POSTs to `/api/reviews/` for a product they already reviewed
- **THEN** the system SHALL return HTTP 409 Conflict (one review per user per product)

#### Scenario: Rating validation rejects out-of-range values
- **WHEN** an authenticated user POSTs with `rating: 0` or `rating: 6`
- **THEN** the system SHALL return HTTP 422 Unprocessable Entity with validation error

### Requirement: Read product reviews
The system SHALL return paginated reviews for any product, including average rating and total review count. Only approved reviews SHALL be visible to regular users. Admins SHALL see all reviews including unmoderated ones.

#### Scenario: Get approved reviews for product
- **WHEN** a user GETs `/api/products/{id}/reviews?page=1&per_page=10`
- **THEN** the system SHALL return paginated approved reviews with HTTP 200, including `total`, `page`, `per_page`, `average_rating`, `total_reviews`, and `reviews` array

#### Scenario: Admin sees all reviews including unmoderated
- **WHEN** an admin user GETs `/api/products/{id}/reviews?include_pending=true`
- **THEN** the system SHALL include unmoderated and rejected reviews in the response

#### Scenario: Empty reviews returns zero counts
- **WHEN** a user GETs reviews for a product with no reviews
- **THEN** the system SHALL return `average_rating: null`, `total_reviews: 0`, and empty `reviews` array

### Requirement: Update own review
The system SHALL allow a user to update their own review's rating, title, and comment. Updating a review SHALL reset its moderation status to pending.

#### Scenario: User updates their own review
- **WHEN** an authenticated user PUTs to `/api/reviews/{id}` with updated fields
- **THEN** the system SHALL update the review, reset `is_approved` to `false`, and return HTTP 200

#### Scenario: User cannot update another user's review
- **WHEN** an authenticated user PUTs to `/api/reviews/{id}` for a review they did not write
- **THEN** the system SHALL return HTTP 403 Forbidden

### Requirement: Delete own review
The system SHALL allow a user to delete their own review.

#### Scenario: User deletes their own review
- **WHEN** an authenticated user DELETEs `/api/reviews/{id}` for their own review
- **THEN** the system SHALL delete the review and return HTTP 204 No Content

### Requirement: Admin moderation
The system SHALL allow admin users to approve or reject reviews. Admins SHALL also be able to delete any review.

#### Scenario: Admin approves review
- **WHEN** an admin user PATCHes `/api/admin/reviews/{id}/moderate` with `action: "approve"`
- **THEN** the system SHALL set `is_approved: true`, record `moderated_by` and `moderated_at`, and return HTTP 200

#### Scenario: Admin rejects review with reason
- **WHEN** an admin user PATCHes `/api/admin/reviews/{id}/moderate` with `action: "reject"` and `rejection_reason: "Inappropriate content"`
- **THEN** the system SHALL set `is_approved: false`, record rejection reason and moderator info, and return HTTP 200

#### Scenario: Admin deletes any review
- **WHEN** an admin user DELETEs `/api/admin/reviews/{id}`
- **THEN** the system SHALL delete the review regardless of ownership and return HTTP 204

#### Scenario: Non-admin cannot moderate
- **WHEN** a non-admin user PATCHes `/api/admin/reviews/{id}/moderate`
- **THEN** the system SHALL return HTTP 403 Forbidden

### Requirement: Review aggregation on product
The system SHALL include review summary (average rating, total count, rating distribution) when fetching a single product.

#### Scenario: Product detail includes review summary
- **WHEN** a user GETs `/api/products/{id}`
- **THEN** the response SHALL include a `reviews` object with `average_rating`, `total_count`, and `distribution` (count per star rating 1-5)

### Requirement: Recent reviews listing
The system SHALL provide an endpoint to list the most recent approved reviews across all products.

#### Scenario: Get recent reviews
- **WHEN** a user GETs `/api/reviews/recent?limit=5`
- **THEN** the system SHALL return the 5 most recent approved reviews with product name, rating, and truncated comment

