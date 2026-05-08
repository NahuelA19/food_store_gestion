# Implementation Tasks — Shopping Cart (Change 7)

**Status**: Ready for Implementation  
**Total Tasks**: 87  
**Estimated Duration**: 8-12 development days (with parallel frontend/backend work)

---

## 1. Database Migrations & Setup

- [ ] 1.1 Create migration file: `backend/migrations/versions/create_carts_and_cart_items_tables.py`
- [ ] 1.2 Add `carts` table definition with columns: `id` (PK), `user_id` (FK, unique), `created_at`, `updated_at`, `expires_at`
- [ ] 1.3 Add `cart_items` table definition with columns: `id` (PK), `cart_id` (FK), `product_id` (FK), `quantity`, `unit_price`, `created_at`, `updated_at`
- [ ] 1.4 Add `UNIQUE` constraint on `carts.user_id` (one cart per user)
- [ ] 1.5 Add `UNIQUE` constraint on `(cart_id, product_id)` in cart_items (one product per cart)
- [ ] 1.6 Add `CHECK` constraint on `cart_items.quantity > 0`
- [ ] 1.7 Add `ON DELETE CASCADE` for foreign key `carts.user_id` → `users.id`
- [ ] 1.8 Add `ON DELETE CASCADE` for foreign key `cart_items.cart_id` → `carts.id`
- [ ] 1.9 Add `ON DELETE RESTRICT` for foreign key `cart_items.product_id` → `products.id`
- [ ] 1.10 Create index on `carts.user_id` for fast user lookups
- [ ] 1.11 Create index on `carts.expires_at` for potential cleanup queries
- [ ] 1.12 Create index on `cart_items.cart_id` for fetching items by cart
- [ ] 1.13 Create index on `cart_items.product_id` for product availability checks
- [ ] 1.14 Run migration locally: `alembic upgrade head`
- [ ] 1.15 Verify schema in PostgreSQL: inspect table structure, constraints, and indexes
- [ ] 1.16 Verify foreign key relationships are correct and cascading works as expected

---

## 2. Backend: Cart Models & Database Layer

- [ ] 2.1 Create Pydantic request model: `AddCartItemRequest` with `product_id: int` and `quantity: int = Field(gt=0, le=999)`
- [ ] 2.2 Create Pydantic request model: `UpdateCartItemRequest` with `quantity: int = Field(gt=0, le=999)`
- [ ] 2.3 Create Pydantic response model: `CartItemResponse` with fields: `id`, `cart_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `subtotal`
- [ ] 2.4 Create Pydantic response model: `CartResponse` with fields: `id`, `user_id`, `items: list[CartItemResponse]`, `total_items`, `subtotal`, `created_at`, `updated_at`
- [ ] 2.5 Create Pydantic response model: `CheckoutResponse` with fields: `cart_id`, `item_count`, `subtotal`, `ready_for_checkout`
- [ ] 2.6 Create SQLAlchemy ORM model: `Cart` in `backend/app/models/cart.py` with columns: `id`, `user_id`, `expires_at`, relationships to `User` and `CartItem`
- [ ] 2.7 Create SQLAlchemy ORM model: `CartItem` in `backend/app/models/cart.py` with columns: `id`, `cart_id`, `product_id`, `quantity`, `unit_price`, relationships to `Cart` and `Product`
- [ ] 2.8 Add `TimestampMixin` (created_at, updated_at) to both `Cart` and `CartItem` models
- [ ] 2.9 Create database query function: `get_cart_by_id(session, cart_id: int) -> Cart | None`
- [ ] 2.10 Create database query function: `get_user_active_cart(session, user_id: int) -> Cart | None`
- [ ] 2.11 Create database query function: `create_cart(session, user_id: int) -> Cart` (returns newly created cart)
- [ ] 2.12 Create database query function: `get_cart_with_items(session, cart_id: int) -> Cart | None` (eager-loads items using selectin)
- [ ] 2.13 Create database query function: `add_item_to_cart(session, cart_id: int, product_id: int, quantity: int, unit_price: Decimal) -> CartItem`
- [ ] 2.14 Create database query function: `get_cart_item_by_id(session, item_id: int) -> CartItem | None`
- [ ] 2.15 Create database query function: `update_cart_item_quantity(session, item_id: int, quantity: int) -> CartItem`
- [ ] 2.16 Create database query function: `remove_cart_item(session, item_id: int) -> bool` (returns True if deleted)
- [ ] 2.17 Create database query function: `clear_cart(session, cart_id: int) -> int` (returns count of deleted items)
- [ ] 2.18 Create database query function: `get_cart_by_user_id(session, user_id: int) -> Cart | None` (for auth'd user to fetch their cart)

---

## 3. Backend: Cart Routes & Endpoints

- [ ] 3.1 Create `backend/app/routes/cart.py` router file
- [ ] 3.2 Implement route: `GET /api/v1/cart` - Fetch authenticated user's current cart (calls get_user_active_cart)
- [ ] 3.3 Implement route: `GET /api/v1/carts/{cart_id}` - Fetch specific cart by ID (with permission check: user_id matches)
- [ ] 3.4 Implement route: `POST /api/v1/carts` - Create new cart for authenticated user (or return existing)
- [ ] 3.5 Implement route: `POST /api/v1/carts/{cart_id}/items` - Add item to cart (calls add_item_to_cart)
- [ ] 3.6 Implement route: `PATCH /api/v1/carts/{cart_id}/items/{item_id}` - Update cart item quantity
- [ ] 3.7 Implement route: `DELETE /api/v1/carts/{cart_id}/items/{item_id}` - Remove item from cart
- [ ] 3.8 Implement route: `DELETE /api/v1/carts/{cart_id}/items` - Clear all items from cart
- [ ] 3.9 Implement route: `POST /api/v1/carts/{cart_id}/checkout` - Validate and prepare cart for checkout
- [ ] 3.10 Add authentication dependency: `@Depends(get_current_user)` to all routes
- [ ] 3.11 Add permission check: Verify cart.user_id matches authenticated user on all cart operations
- [ ] 3.12 Add error handling: Return 404 if cart not found
- [ ] 3.13 Add error handling: Return 404 if product not found in add_item_to_cart
- [ ] 3.14 Add error handling: Return 409 if product is inactive when adding to cart
- [ ] 3.15 Add error handling: Return 404 if cart item not found when updating/deleting
- [ ] 3.16 Add error handling: Return 401 if user not authenticated
- [ ] 3.17 Add error handling: Return 422 if quantity invalid (≤0 or >999)
- [ ] 3.18 Register cart router in `backend/app/main.py`: `app.include_router(router, prefix="/api/v1", tags=["cart"])`
- [ ] 3.19 Verify all routes appear in Swagger UI at `http://localhost:8000/docs`
- [ ] 3.20 Test routes manually with curl or Postman to ensure basic functionality

---

## 4. Backend: Cart Logic & Validation

- [ ] 4.1 Implement cart total calculation function: `calculate_cart_totals(items: list[CartItem]) -> dict` returning `subtotal`, `total_items`
- [ ] 4.2 Implement product validation function: `validate_product_for_cart(session, product_id: int) -> Product` (checks exists, is_active)
- [ ] 4.3 Implement cart initialization on first add: If user has no cart, create one automatically
- [ ] 4.4 Implement idempotent add-item logic: If product already in cart, update quantity instead of duplicate
- [ ] 4.5 Implement price snapshot: Store product.price as unit_price on add-to-cart (immutable per cart item)
- [ ] 4.6 Implement checkout validation: Verify all items still available (product exists, is_active) before checkout
- [ ] 4.7 Implement checkout response: Return cart totals and validation status in CheckoutResponse
- [ ] 4.8 Add logging: Log info/debug messages for cart operations (add, remove, update, clear)
- [ ] 4.9 Add error logging: Log warnings for validation failures (product not found, inactive, etc.)
- [ ] 4.10 Implement idempotency key handling (optional): Support repeated requests without duplicate adds
- [ ] 4.11 Add cart state transitions: Track cart.status ("active" → "checked_out") to prevent modifications post-checkout

---

## 5. Frontend: Cart Context & Hooks

- [ ] 5.1 Create `frontend/src/context/CartContext.tsx` with React Context for cart state
- [ ] 5.2 Define TypeScript type: `Cart` with fields: `id`, `user_id`, `items: CartItem[]`, `total_items`, `subtotal`, `created_at`, `updated_at`
- [ ] 5.3 Define TypeScript type: `CartItem` with fields: `id`, `cart_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `subtotal`
- [ ] 5.4 Define TypeScript type: `CartContextType` with state and action methods
- [ ] 5.5 Create CartContext provider: Initialize state with `cart: null`, `items: []`, `loading: false`, `error: null`
- [ ] 5.6 Implement CartContext provider component: Wraps children and provides context value
- [ ] 5.7 Create `frontend/src/hooks/useCart.ts` custom hook to consume CartContext
- [ ] 5.8 Implement useCart method: `getCart() -> Promise<Cart>` (calls GET /api/v1/cart)
- [ ] 5.9 Implement useCart method: `addItem(product_id: number, quantity: number) -> Promise<CartItem>` (POST /api/v1/carts/{cart_id}/items)
- [ ] 5.10 Implement useCart method: `removeItem(item_id: number) -> Promise<void>` (DELETE /api/v1/carts/{cart_id}/items/{item_id})
- [ ] 5.11 Implement useCart method: `updateQuantity(item_id: number, quantity: number) -> Promise<CartItem>` (PATCH request)
- [ ] 5.12 Implement useCart method: `clearCart() -> Promise<void>` (DELETE /api/v1/carts/{cart_id}/items)
- [ ] 5.13 Implement useCart method: `checkout() -> Promise<CheckoutResponse>` (POST /api/v1/carts/{cart_id}/checkout)
- [ ] 5.14 Add optimistic updates: UI updates immediately for add/remove, then syncs with API
- [ ] 5.15 Add error handling: Rollback optimistic updates if API call fails
- [ ] 5.16 Add loading states: Expose `loading`, `error` flags for UI feedback
- [ ] 5.17 Add localStorage persistence (optional): Save cart state for recovery on app reload
- [ ] 5.18 Wrap `<App />` component with `<CartProvider>` in `frontend/src/main.tsx`
- [ ] 5.19 Test context initialization: Verify CartContext is available to all child components
- [ ] 5.20 Test hook exports: Verify useCart hook can be imported and used in components

---

## 6. Frontend: Cart Components & UI

- [ ] 6.1 Create `frontend/src/components/Cart/CartBadge.tsx` component displaying item count in header
- [ ] 6.2 Implement CartBadge: Shows "0" when empty, "N" when N items in cart, linked to CartPage
- [ ] 6.3 Implement CartBadge styling: Badge style (small circle), positioned top-right of cart icon
- [ ] 6.4 Create `frontend/src/components/Cart/CartItem.tsx` component for single cart item display
- [ ] 6.5 Implement CartItem: Shows product name, price, quantity, subtotal, remove button
- [ ] 6.6 Implement CartItem remove button: Calls useCart().removeItem()
- [ ] 6.7 Create `frontend/src/components/Cart/CartItemList.tsx` component for list of items
- [ ] 6.8 Implement CartItemList: Maps over cart items, renders CartItem for each
- [ ] 6.9 Create `frontend/src/components/Cart/CartTotals.tsx` component showing totals
- [ ] 6.10 Implement CartTotals: Shows item_count, subtotal, with clean formatting
- [ ] 6.11 Create `frontend/src/components/Cart/CartSidebar.tsx` (optional) for slide-out preview
- [ ] 6.12 Implement CartSidebar: Shows 3-5 most recent items, link to full CartPage
- [ ] 6.13 Create `frontend/src/pages/CartPage.tsx` full cart view page component
- [ ] 6.14 Implement CartPage: Renders CartItemList, CartTotals, "Proceed to Checkout" button
- [ ] 6.15 Implement CartPage empty state: Shows "Your cart is empty" with link to shop
- [ ] 6.16 Implement CartPage loading state: Shows spinner while fetching cart
- [ ] 6.17 Implement CartPage error state: Shows error message if cart fetch fails
- [ ] 6.18 Add quantity spinner: CartItem should have +/- buttons to update quantity
- [ ] 6.19 Update `frontend/src/components/Navigation.tsx` to include CartBadge
- [ ] 6.20 Apply consistent styling: Use design system (colors, spacing, fonts) from project

---

## 7. Frontend: Cart Integration & Data Flow

- [ ] 7.1 Update `frontend/src/components/ProductCard.tsx` to add "Add to Cart" button
- [ ] 7.2 Implement ProductCard button: Calls useCart().addItem(product_id, 1)
- [ ] 7.3 Implement button loading state: Shows "Adding..." spinner while request in flight
- [ ] 7.4 Implement button error handling: Shows toast/alert if add fails (product inactive, etc.)
- [ ] 7.5 Implement button success feedback: Show toast "Added to cart"
- [ ] 7.6 Update CartPage component: Fetch cart on mount using useCart().getCart()
- [ ] 7.7 Update CartPage: Display fetched cart items and totals
- [ ] 7.8 Connect CartItem remove button: useCart().removeItem(item_id)
- [ ] 7.9 Connect CartItem quantity spinner: useCart().updateQuantity(item_id, newQty)
- [ ] 7.10 Implement cart sync on app load: useEffect in App.tsx calls useCart().getCart()
- [ ] 7.11 Implement error toast: Use notifications/toast library to show API errors
- [ ] 7.12 Implement success toast: Use notifications/toast library to confirm actions
- [ ] 7.13 Add "Proceed to Checkout" button in CartPage (routes to /checkout, deferred to Change 8)
- [ ] 7.14 Test data flow: Add item from ProductCard → Verify CartBadge updates → Open CartPage → Verify item appears
- [ ] 7.15 Test optimistic updates: Verify UI responds immediately before API confirmation

---

## 8. Backend: Unit Tests for Models & Queries

- [ ] 8.1 Create `backend/tests/test_cart_models.py`
- [ ] 8.2 Test Pydantic model: `AddCartItemRequest` accepts valid quantity (1-999)
- [ ] 8.3 Test Pydantic model: `AddCartItemRequest` rejects invalid quantity (0, 1000, negative)
- [ ] 8.4 Test Pydantic model: `CartItemResponse` serializes correctly with all fields
- [ ] 8.5 Test Pydantic model: `CartResponse` serializes cart with items list
- [ ] 8.6 Test SQLAlchemy model: `Cart` can be created with user_id and timestamps
- [ ] 8.7 Test SQLAlchemy model: `CartItem` can be created with quantity, unit_price
- [ ] 8.8 Create `backend/tests/test_cart_queries.py`
- [ ] 8.9 Test query: `get_user_active_cart()` returns None for user with no cart
- [ ] 8.10 Test query: `get_user_active_cart()` returns existing cart for user
- [ ] 8.11 Test query: `create_cart()` creates new cart with generated id, timestamps
- [ ] 8.12 Test query: `add_item_to_cart()` creates CartItem with correct unit_price snapshot
- [ ] 8.13 Test query: `add_item_to_cart()` idempotently updates quantity if product already exists
- [ ] 8.14 Test query: `get_cart_with_items()` eager-loads items (verify single query, no N+1)
- [ ] 8.15 Test query: `update_cart_item_quantity()` modifies quantity and updates updated_at
- [ ] 8.16 Test query: `remove_cart_item()` deletes item, returns True
- [ ] 8.17 Test query: `remove_cart_item()` returns False if item not found
- [ ] 8.18 Test query: `clear_cart()` deletes all items, returns count
- [ ] 8.19 Test database constraint: UNIQUE on (user_id) prevents duplicate carts
- [ ] 8.20 Test database constraint: UNIQUE on (cart_id, product_id) prevents duplicate items

---

## 9. Backend: Integration Tests for Cart Endpoints

- [ ] 9.1 Create `backend/tests/test_cart_routes.py`
- [ ] 9.2 Setup test fixture: Create authenticated test user with token
- [ ] 9.3 Setup test fixture: Create test products
- [ ] 9.4 Test endpoint: GET /api/v1/cart returns 401 for unauthenticated user
- [ ] 9.5 Test endpoint: GET /api/v1/cart returns empty cart (or creates one) for new user
- [ ] 9.6 Test endpoint: GET /api/v1/cart returns cart with items for user with existing cart
- [ ] 9.7 Test endpoint: POST /api/v1/carts creates new cart, returns CartResponse
- [ ] 9.8 Test endpoint: POST /api/v1/carts/{cart_id}/items adds item, returns CartItemResponse with correct subtotal
- [ ] 9.9 Test endpoint: POST /api/v1/carts/{cart_id}/items with product_id=999 (not found) returns 404
- [ ] 9.10 Test endpoint: POST /api/v1/carts/{cart_id}/items with inactive product returns 409 Conflict
- [ ] 9.11 Test endpoint: POST /api/v1/carts/{cart_id}/items with quantity=0 returns 422
- [ ] 9.12 Test endpoint: POST /api/v1/carts/{cart_id}/items with duplicate product updates quantity instead of duplicate
- [ ] 9.13 Test endpoint: PATCH /api/v1/carts/{cart_id}/items/{item_id} updates quantity
- [ ] 9.14 Test endpoint: PATCH /api/v1/carts/{cart_id}/items/{item_id} with quantity>999 returns 422
- [ ] 9.15 Test endpoint: DELETE /api/v1/carts/{cart_id}/items/{item_id} removes item, returns 204
- [ ] 9.16 Test endpoint: DELETE /api/v1/carts/{cart_id}/items/{item_id} with non-existent item returns 404
- [ ] 9.17 Test endpoint: DELETE /api/v1/carts/{cart_id}/items clears all items
- [ ] 9.18 Test endpoint: POST /api/v1/carts/{cart_id}/checkout validates cart and returns CheckoutResponse
- [ ] 9.19 Test endpoint: Cart endpoints verify user_id matches authenticated user (permission check)
- [ ] 9.20 Test endpoint: Cart totals calculated correctly (subtotal = sum of item subtotals)

---

## 10. Backend: E2E Test Scenario

- [ ] 10.1 Create `backend/tests/test_cart_e2e.py` for end-to-end flow
- [ ] 10.2 E2E test: Login user → No cart exists
- [ ] 10.3 E2E test: Add first product to cart → Cart created automatically
- [ ] 10.4 E2E test: Add same product again → Quantity updated (idempotent)
- [ ] 10.5 E2E test: Add different product to cart → CartItem created
- [ ] 10.6 E2E test: Fetch cart → Returns 2 items with correct totals
- [ ] 10.7 E2E test: Update quantity of first item → Subtotal recalculated
- [ ] 10.8 E2E test: Remove one item → Cart now has 1 item
- [ ] 10.9 E2E test: Fetch cart → Verifies updated state
- [ ] 10.10 E2E test: Clear cart → All items deleted
- [ ] 10.11 E2E test: Fetch cart after clear → Returns empty items array
- [ ] 10.12 E2E test: Initiate checkout → Validates cart, returns ready_for_checkout=true
- [ ] 10.13 Run pytest with coverage: `pytest backend/tests/test_cart_*.py --cov=app.routes.cart --cov-report=html`
- [ ] 10.14 Verify coverage ≥80% for cart module
- [ ] 10.15 Run all backend tests to ensure no regressions

---

## 11. Frontend: Component Tests

- [ ] 11.1 Create `frontend/src/__tests__/components/CartBadge.test.tsx`
- [ ] 11.2 Test CartBadge: Renders "0" when cart has 0 items
- [ ] 11.3 Test CartBadge: Renders "5" when cart has 5 items
- [ ] 11.4 Test CartBadge: Updates when cart item count changes
- [ ] 11.5 Test CartBadge: Clicking badge navigates to /cart
- [ ] 11.6 Create `frontend/src/__tests__/components/CartItem.test.tsx`
- [ ] 11.7 Test CartItem: Renders product name, price, quantity, subtotal
- [ ] 11.8 Test CartItem: Remove button calls onRemove callback
- [ ] 11.9 Test CartItem: Quantity spinner +/- buttons call onUpdateQuantity
- [ ] 11.10 Create `frontend/src/__tests__/components/CartTotals.test.tsx`
- [ ] 11.11 Test CartTotals: Displays item_count and subtotal correctly
- [ ] 11.12 Test CartTotals: Formats currency properly (e.g., "$99.99")
- [ ] 11.13 Create `frontend/src/__tests__/components/ProductCard.test.tsx` (update existing test)
- [ ] 11.14 Test ProductCard: "Add to Cart" button is present
- [ ] 11.15 Test ProductCard: Clicking "Add to Cart" calls addItem function
- [ ] 11.16 Test ProductCard: Shows loading state while adding to cart
- [ ] 11.17 Test ProductCard: Shows success toast on successful add

---

## 12. Frontend: Hook Tests & Integration Tests

- [ ] 12.1 Create `frontend/src/__tests__/hooks/useCart.test.ts`
- [ ] 12.2 Test useCart hook: getCart() fetches cart from API and updates context
- [ ] 12.3 Test useCart hook: addItem() optimistically updates local state, then syncs API
- [ ] 12.4 Test useCart hook: addItem() handles API errors and reverts optimistic update
- [ ] 12.5 Test useCart hook: removeItem() calls DELETE endpoint and updates state
- [ ] 12.6 Test useCart hook: updateQuantity() calls PATCH endpoint and updates state
- [ ] 12.7 Test useCart hook: clearCart() deletes all items
- [ ] 12.8 Create `frontend/src/__tests__/pages/CartPage.test.tsx`
- [ ] 12.9 Test CartPage: Fetches and displays cart items on mount
- [ ] 12.10 Test CartPage: Shows loading spinner while fetching
- [ ] 12.11 Test CartPage: Shows error message if fetch fails
- [ ] 12.12 Test CartPage: Shows empty state when cart has no items
- [ ] 12.13 Test CartPage: Remove button removes item from cart
- [ ] 12.14 Test CartPage: Quantity spinner updates item quantity
- [ ] 12.15 Create `frontend/src/__tests__/integration/cart-flow.test.tsx`
- [ ] 12.16 Integration test: Add item from ProductCard → CartBadge updates → Open CartPage → Verify item
- [ ] 12.17 Integration test: Mock API responses for all cart operations
- [ ] 12.18 Run npm run test --workspace frontend, verify all tests pass
- [ ] 12.19 Run coverage: Verify ≥80% for cart components and hooks
- [ ] 12.20 Run Vitest with --ui flag to visually verify test results

---

## 13. Frontend: Responsive Design & Accessibility

- [ ] 13.1 Test CartBadge layout on mobile (320px), tablet (768px), desktop (1920px)
- [ ] 13.2 Test CartPage layout on mobile, tablet, desktop
- [ ] 13.3 Test CartItem responsiveness: Stack layout on mobile, grid on desktop
- [ ] 13.4 Verify touch targets: Buttons ≥44px height on mobile
- [ ] 13.5 Test keyboard navigation: Tab through CartItem remove/update buttons
- [ ] 13.6 Test screen reader compatibility: Verify ARIA labels on buttons and inputs
- [ ] 13.7 Test focus indicators: Verify visible outline on all interactive elements
- [ ] 13.8 Test color contrast: Verify WCAG AA compliance on cart text and buttons
- [ ] 13.9 Test form accessibility: Quantity input has proper label and error messaging
- [ ] 13.10 Test loading states: Spinners or skeleton screens display during loading

---

## 14. Manual Testing & QA

- [ ] 14.1 Start backend dev server: `cd backend && uvicorn app.main:app --reload`
- [ ] 14.2 Verify Swagger UI available at `http://localhost:8000/docs`
- [ ] 14.3 Start frontend dev server: `npm run dev --workspace frontend`
- [ ] 14.4 Test scenario: Login → Browse products page
- [ ] 14.5 Test scenario: Click "Add to Cart" → See CartBadge increment
- [ ] 14.6 Test scenario: Add multiple different products → CartBadge shows correct count
- [ ] 14.7 Test scenario: Open CartPage → View all added items with prices and quantities
- [ ] 14.8 Test scenario: Update quantity using spinner → See subtotal update
- [ ] 14.9 Test scenario: Remove item → Item deleted from cart, CartBadge updates
- [ ] 14.10 Test scenario: Clear cart → All items deleted
- [ ] 14.11 Test scenario: Refresh page → Cart state persists from database
- [ ] 14.12 Test scenario: Logout and login → Same cart data appears
- [ ] 14.13 Test scenario: Open two browser tabs (same user) → Both see consistent cart state
- [ ] 14.14 Test scenario: Open two incognito windows (different users) → Each has separate cart
- [ ] 14.15 Test error case: Try to add product with quantity=0 → See validation error
- [ ] 14.16 Test error case: Try to add inactive product → See error message
- [ ] 14.17 Test error case: Network error during add → See error toast, cart reverts
- [ ] 14.18 Test mobile layout: Open CartPage on phone/tablet → Layout responsive
- [ ] 14.19 Performance test: Add 50+ items to cart → Page loads without noticeable lag
- [ ] 14.20 Performance test: Open DevTools Network tab → Verify API calls are efficient (no N+1)

---

## 15. Code Quality & Linting

- [ ] 15.1 Run backend linter: `ruff check backend/app/routes/cart.py`
- [ ] 15.2 Fix backend lint errors (unused imports, line length, naming)
- [ ] 15.3 Run backend formatter: `black backend/app`
- [ ] 15.4 Verify backend formatting is correct
- [ ] 15.5 Run backend type checker: `mypy backend/app/routes/cart.py`
- [ ] 15.6 Fix any mypy errors (type hints, etc.)
- [ ] 15.7 Run frontend linter: `npm run lint --workspace frontend`
- [ ] 15.8 Fix frontend lint errors (unused variables, etc.)
- [ ] 15.9 Run frontend formatter: `npm run format --workspace frontend`
- [ ] 15.10 Verify frontend formatting is correct
- [ ] 15.11 Run frontend type checker: `npm run type-check --workspace frontend`
- [ ] 15.12 Fix any TypeScript errors
- [ ] 15.13 Remove any debug console.log() statements from code
- [ ] 15.14 Remove any commented-out code blocks
- [ ] 15.15 Run full linting suite: `npm run check:all`

---

## 16. Dependencies & Documentation

- [ ] 16.1 Verify backend/requirements.txt contains all necessary dependencies (asyncpg, sqlalchemy, etc.)
- [ ] 16.2 Verify no NEW dependencies were added to backend (use existing fastapi, pydantic, etc.)
- [ ] 16.3 Verify frontend/package.json contains all necessary dependencies
- [ ] 16.4 Verify no NEW npm dependencies were added to frontend (use existing react, etc.)
- [ ] 16.5 Add inline code comments for complex cart logic in backend (e.g., price snapshot, idempotency)
- [ ] 16.6 Add inline code comments for complex cart logic in frontend (e.g., optimistic updates)
- [ ] 16.7 Create IMPLEMENTATION_NOTES.md in change directory: Document any non-obvious decisions or gotchas
- [ ] 16.8 Update backend/app/main.py router registration comments if needed
- [ ] 16.9 Verify Swagger/OpenAPI documentation is complete for all cart endpoints
- [ ] 16.10 Add docstrings to all public functions in cart.py (routes and queries)

---

## 17. Final Verification & Git

- [ ] 17.1 Run full test suite: `pytest backend/tests/test_cart_*.py`
- [ ] 17.2 Run frontend tests: `npm run test --workspace frontend`
- [ ] 17.3 Verify all tests pass (0 failures)
- [ ] 17.4 Verify test coverage ≥80% for cart module (both backend and frontend)
- [ ] 17.5 Start both dev servers and run manual smoke test (add → view → remove)
- [ ] 17.6 Check browser console: No errors or warnings visible
- [ ] 17.7 Check backend terminal: No unhandled exceptions or warnings
- [ ] 17.8 Run `git status` to see all changed files
- [ ] 17.9 Verify all cart-related files are staged for commit
- [ ] 17.10 Create feature branch (if not already created): `git checkout -b feature/shopping-cart`
- [ ] 17.11 Commit with conventional message: `git commit -m "feat(shopping-cart): implement cart management"`
- [ ] 17.12 Verify commit appears in `git log`: Shows complete diff with all changes

---

## 18. OpenSpec Status & Archive

- [ ] 18.1 Run OpenSpec status check: `openspec status --change "implement-shopping-cart"`
- [ ] 18.2 Verify all tasks are marked complete in OpenSpec
- [ ] 18.3 Verify design, specs, and tasks files are in sync
- [ ] 18.4 Generate JSON export: `openspec status --change "implement-shopping-cart" --json`
- [ ] 18.5 Review JSON for completeness
- [ ] 18.6 Archive the change: `openspec archive --change "implement-shopping-cart"`
- [ ] 18.7 Verify archive was successful
- [ ] 18.8 Confirm change no longer appears in `openspec list` (or appears as archived)

---

## Summary

**Total Tasks**: 87  
**Phases**: 18  
**Key Milestones**:
1. Database setup (1.1-1.16)
2. Backend models and queries (2.1-2.18)
3. Backend routes and endpoints (3.1-3.20)
4. Backend logic and validation (4.1-4.11)
5. Frontend context and hooks (5.1-5.20)
6. Frontend components (6.1-6.20)
7. Frontend integration (7.1-7.15)
8. Backend unit tests (8.1-8.20)
9. Backend integration tests (9.1-9.20)
10. Backend E2E tests (10.1-10.15)
11. Frontend component tests (11.1-11.17)
12. Frontend hook and integration tests (12.1-12.20)
13. Responsive design and accessibility (13.1-13.10)
14. Manual testing and QA (14.1-14.20)
15. Code quality and linting (15.1-15.15)
16. Dependencies and documentation (16.1-16.10)
17. Final verification and git (17.1-17.12)
18. OpenSpec status and archive (18.1-18.8)

**Estimated Effort**: 80-120 hours (8-12 development days with parallel frontend/backend work)  
**Dependencies**: All prerequisite changes (Authentication, User Service, Product Catalog, Search & Filtering) must be complete.

---

*This tasks.md was generated from proposal.md, design.md, and specs for Change 7 (Shopping Cart implementation).*
