## ADDED Requirements

### Requirement: Toggle product in wishlist
The system SHALL allow authenticated users to toggle a product in their wishlist. If the product is already wishlisted, it SHALL be removed. If not, it SHALL be added. The response SHALL indicate the new state.

#### Scenario: Add product to wishlist
- **WHEN** an authenticated user POSTs to `/api/wishlist/toggle/{product_id}` for a product NOT in their wishlist
- **THEN** the system SHALL add the product to the wishlist and return `{ is_wishlisted: true }` with HTTP 200

#### Scenario: Remove product from wishlist
- **WHEN** an authenticated user POSTs to `/api/wishlist/toggle/{product_id}` for a product already in their wishlist
- **THEN** the system SHALL remove the product from the wishlist and return `{ is_wishlisted: false }` with HTTP 200

#### Scenario: Toggle without auth
- **WHEN** an unauthenticated request POSTs to `/api/wishlist/toggle/{product_id}`
- **THEN** the system SHALL return HTTP 401 Unauthorized

#### Scenario: Toggle non-existent product
- **WHEN** an authenticated user POSTs to `/api/wishlist/toggle/{product_id}` for a non-existent product
- **THEN** the system SHALL return HTTP 404 Not Found

### Requirement: List wishlist items
The system SHALL return all wishlisted products for the authenticated user, including full product details with category and inventory.

#### Scenario: List wishlist with items
- **WHEN** an authenticated user GETs `/api/wishlist/`
- **THEN** the system SHALL return an array of wishlist items with full product details, ordered by creation date descending

#### Scenario: List empty wishlist
- **WHEN** an authenticated user with no wishlist items GETs `/api/wishlist/`
- **THEN** the system SHALL return an empty array

#### Scenario: List without auth
- **WHEN** an unauthenticated request GETs `/api/wishlist/`
- **THEN** the system SHALL return HTTP 401 Unauthorized

### Requirement: Check wishlist status
The system SHALL allow checking if one or more products are in the user's wishlist.

#### Scenario: Check single product
- **WHEN** an authenticated user GETs `/api/wishlist/check?product_ids=1`
- **THEN** the system SHALL return `{ "1": true }` or `{ "1": false }` based on wishlist state

#### Scenario: Check multiple products
- **WHEN** an authenticated user GETs `/api/wishlist/check?product_ids=1,2,3`
- **THEN** the system SHALL return a map like `{ "1": true, "2": false, "3": true }`

### Requirement: Wishlist badge shows count
The system SHALL display a count badge next to the wishlist/heart icon in the navigation, showing the number of wishlisted items.

#### Scenario: Wishlist badge shows correct count
- **WHEN** a user has 3 items in their wishlist
- **THEN** the navigation SHALL show a heart icon with a badge displaying "3"

#### Scenario: Empty wishlist hides badge
- **WHEN** a user has no wishlist items
- **THEN** the navigation SHALL show a heart icon with no badge
