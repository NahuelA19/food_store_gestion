# Change 5: Product Service — Implementation Tasks

**Total Effort Estimate**: 70-87 hours (~2 weeks)  
**Format**: Numbered checklist with `- [x]` checkboxes

---

## Section 1: Database Schema & Migrations (8-10 tasks | 6-8 hours)

Create Alembic migrations for new tables and indexes. These tasks assume Change 2 (database layer) is complete and categories/products tables exist.

- [x] 1.1: Create Alembic migration file for `inventory` table
- [x] 1.2: Add migration `CREATE TABLE inventory` with all columns and constraints
- [x] 1.3: Add index on `inventory.product_id` (unique constraint)
- [x] 1.4: Add index on `inventory.stock_quantity` for filtering
- [x] 1.5: Add index on `products.name` for search (if not already present)
- [x] 1.6: Add index on `products.category_id` (if not already present)
- [x] 1.7: Add index on `products.price` for price range filtering
- [x] 1.8: Add index on `products.is_available` for availability filtering
- [x] 1.9: Run `alembic upgrade head` and verify tables exist
- [x] 1.10: Create database seed script with sample categories and products

---

## Section 2: ORM Models & Relationships (8-10 tasks | 6-8 hours)

Define SQLAlchemy models with proper relationships, lazy loading, and cascades.

- [x] 2.1: Create `app/models/inventory.py` with `Inventory` class
- [x] 2.2: Add all columns to Inventory model (product_id, stock_quantity, reserved_quantity, etc.)
- [x] 2.3: Add `TimestampMixin` to Inventory model
- [x] 2.4: Add relationship `Inventory.product` with back_populates
- [x] 2.5: Update Product model: add `inventory` relationship (one-to-one)
- [x] 2.6: Add lazy loading `selectinload` to Product.category
- [x] 2.7: Add lazy loading `selectinload` to Product.inventory
- [x] 2.8: Update Category model: ensure `products` relationship has `selectinload`
- [x] 2.9: Add `@property available_quantity` to Inventory (calculated)
- [x] 2.10: Test ORM models: create product + inventory, verify relationships load

---

## Section 3: Pydantic Validation Schemas (6-8 tasks | 4-6 hours)

Create request/response schemas for all endpoints with proper validation.

- [x] 3.1: Create `app/models/schemas.py` with all Pydantic models
- [x] 3.2: Implement `ProductCreate` schema with validation rules
- [x] 3.3: Implement `ProductUpdate` schema (all fields optional)
- [x] 3.4: Implement `ProductResponse` schema with nested Category
- [x] 3.5: Implement `InventoryResponse` schema with available_quantity
- [x] 3.6: Implement `ProductDetailResponse` (includes full inventory)
- [x] 3.7: Implement `CategoryCreate`, `CategoryUpdate`, `CategoryResponse` schemas
- [x] 3.8: Add ConfigDict with `from_attributes=True` to all response models

---

## Section 4: Category API Endpoints (8-10 tasks | 6-8 hours)

Implement CRUD endpoints for categories. Reuse existing category model if present.

- [x] 4.1: Create `app/routes/categories.py` with router setup
- [x] 4.2: Implement `GET /api/categories` — list all categories with product count
- [x] 4.3: Add pagination/limit parameters to category list endpoint
- [x] 4.4: Implement `GET /api/categories/{id}` — get category with products
- [x] 4.5: Implement `POST /api/categories` — create category (admin only)
- [x] 4.6: Add validation: reject duplicate category names (409 Conflict)
- [x] 4.7: Implement `PUT /api/categories/{id}` — update category (admin only)
- [x] 4.8: Implement `DELETE /api/categories/{id}` — delete category (admin only)
- [x] 4.9: Add business logic: prevent deletion if category has products
- [x] 4.10: Register category router in `app/main.py`

---

## Section 5: Product API Endpoints (10-12 tasks | 8-10 hours)

Implement full CRUD + search/filter endpoints for products.

- [x] 5.1: Create `app/routes/products.py` with router setup
- [x] 5.2: Implement `GET /api/products` — list with pagination
- [x] 5.3: Add category_id filter to product list
- [x] 5.4: Add price range filters (min_price, max_price) to product list
- [x] 5.5: Add search parameter (by name) to product list
- [x] 5.6: Add in_stock filter (availability) to product list
- [x] 5.7: Add sorting (name, price, created_at) + order (asc/desc) to product list
- [x] 5.8: Implement `GET /api/products/{id}` — get single product with inventory
- [x] 5.9: Implement `POST /api/products` — create product (admin only)
- [x] 5.10: Auto-create inventory record when product is created (stock_quantity=0)
- [x] 5.11: Implement `PUT /api/products/{id}` — update product (admin only)
- [x] 5.12: Implement `DELETE /api/products/{id}` — delete product (admin only, cascade to inventory)

---

## Section 6: Additional Product Endpoints (6-8 tasks | 4-6 hours)

Implement search, related products, and availability toggle endpoints.

- [x] 6.1: Implement `GET /api/products/search?q=query` — search by name
- [x] 6.2: Add pagination to search results
- [x] 6.3: Implement `GET /api/products/{id}/related` — get products in same category
- [x] 6.4: Limit related products to top 4 (exclude requested product)
- [x] 6.5: Implement `PUT /api/products/{id}/availability` — toggle is_available flag
- [x] 6.6: Ensure availability changes don't affect inventory levels
- [x] 6.7: Return proper error responses (404, 400, 403) for all endpoints
- [x] 6.8: Test all product endpoints with admin + non-admin users

---

## Section 7: Inventory Management (6-8 tasks | 4-6 hours)

Implement inventory tracking and stock management endpoints.

- [x] 7.1: Create inventory endpoints in routes or add to products
- [x] 7.2: Implement `GET /api/inventory/{product_id}` — get stock levels
- [x] 7.3: Implement `PUT /api/inventory/{product_id}` — update stock quantity (admin)
- [x] 7.4: Implement `POST /api/inventory/{product_id}/reserve` — reserve stock
- [x] 7.5: Add validation: cannot reserve more than available_quantity
- [x] 7.6: Add validation: stock_quantity must be >= reserved_quantity
- [x] 7.7: Calculate available_quantity = stock_quantity - reserved_quantity
- [x] 7.8: Return 400 if trying to set stock below reserved amount

---

## Section 8: Query Optimization & Pagination (6-8 tasks | 4-6 hours)

Ensure efficient queries with pagination, indexes, and eager loading.

- [x] 8.1: Use `selectinload()` for Product.category and Product.inventory relationships
- [x] 8.2: Add default pagination (page=1, limit=20, max=100)
- [x] 8.3: Implement OFFSET/LIMIT in all list endpoints
- [x] 8.4: Add query parameter validation (page >= 1, limit 1-100)
- [x] 8.5: Test `EXPLAIN ANALYZE` on product list query with filters
- [x] 8.6: Verify indexes exist for category_id, is_available, price
- [x] 8.7: Test N+1 prevention (ensure one query for products + relationships)
- [x] 8.8: Add response pagination metadata (total, page, total_pages, has_next, has_previous)

---

## Section 9: Error Handling & Validation (6-8 tasks | 4-6 hours)

Implement consistent error responses and validation.

- [x] 9.1: Create error response model (detail, error_code, status_code)
- [x] 9.2: Handle 404 errors (product/category not found)
- [x] 9.3: Handle 400 errors (validation failures)
- [x] 9.4: Handle 401 errors (authentication required)
- [x] 9.5: Handle 403 errors (admin-only endpoints)
- [x] 9.6: Handle 409 errors (business logic violations, duplicate names)
- [x] 9.7: Add HTTPException with proper status codes for all error cases
- [x] 9.8: Test error response format in all endpoints

---

## Section 10: Backend Testing — Unit Tests (6-8 tasks | 6-8 hours)

Write unit tests for Pydantic schemas and model methods.

- [x] 10.1: Create `backend/tests/test_schemas.py`
- [x] 10.2: Test ProductCreate schema validation (valid/invalid inputs)
- [x] 10.3: Test ProductUpdate schema (optional fields)
- [x] 10.4: Test CategoryCreate schema (unique name validation)
- [x] 10.5: Test InventoryResponse schema (available_quantity calculation)
- [x] 10.6: Test that invalid prices (negative, >2 decimals) are rejected
- [x] 10.7: Test that invalid category_id is rejected
- [x] 10.8: Verify schemas serialize correctly with ConfigDict(from_attributes=True)

---

## Section 11: Backend Testing — Route Tests (12-15 tasks | 10-12 hours)

Write integration tests for all endpoints.

- [x] 11.1: Create `backend/tests/test_categories.py` with fixtures
- [x] 11.2: Test GET /api/categories — happy path (returns all categories)
- [x] 11.3: Test GET /api/categories/{id} — happy path + 404
- [x] 11.4: Test POST /api/categories — create + verify inventory not created
- [x] 11.5: Test POST /api/categories — duplicate name returns 409
- [x] 11.6: Test POST /api/categories — requires admin role (403 for non-admin)
- [x] 11.7: Test PUT /api/categories/{id} — update fields
- [x] 11.8: Test DELETE /api/categories/{id} — verify cascade/constraints
- [x] 11.9: Create `backend/tests/test_products.py` with fixtures
- [x] 11.10: Test GET /api/products — returns paginated list
- [x] 11.11: Test GET /api/products?category_id=1 — filter by category
- [x] 11.12: Test GET /api/products?min_price=2&max_price=5 — price range
- [x] 11.13: Test GET /api/products?in_stock=true — availability filter
- [x] 11.14: Test GET /api/products/{id} — includes inventory + category
- [x] 11.15: Test POST /api/products — create + auto-create inventory with 0 stock

---

## Section 12: Backend Testing — Advanced Tests (8-10 tasks | 8-10 hours)

Write tests for search, related products, inventory, and edge cases.

- [x] 12.1: Test POST /api/products — invalid category_id returns 400
- [x] 12.2: Test PUT /api/products/{id} — partial update
- [x] 12.3: Test DELETE /api/products/{id} — cascade to inventory
- [x] 12.4: Test GET /api/products/search?q=tomato — search functionality
- [x] 12.5: Test GET /api/products/{id}/related — returns products in category
- [x] 12.6: Test PUT /api/products/{id}/availability — toggle flag
- [x] 12.7: Test GET /api/inventory/{product_id} — returns stock levels
- [x] 12.8: Test PUT /api/inventory/{product_id} — update stock (admin only)
- [x] 12.9: Test POST /api/inventory/{product_id}/reserve — reserve stock
- [x] 12.10: Test inventory validation (cannot reserve > available)

---

## Section 13: Frontend — ProductGrid Component (8-10 tasks | 6-8 hours)

Build component to display paginated product list.

- [x] 13.1: Create `src/components/ProductGrid.tsx`
- [x] 13.2: Accept props: products[], isLoading, error, onPageChange, currentPage, totalPages
- [x] 13.3: Render loading skeleton while fetching
- [x] 13.4: Render grid layout (1 col mobile, 2 col tablet, 4 col desktop)
- [x] 13.5: Render ProductCard for each product
- [x] 13.6: Display error state with retry button if loading fails
- [x] 13.7: Render Pagination component below grid
- [x] 13.8: Use React.memo() to prevent unnecessary re-renders
- [x] 13.9: Add accessibility attributes (role, aria-labels)
- [x] 13.10: Test component renders with sample products

---

## Section 14: Frontend — ProductCard Component (6-8 tasks | 4-6 hours)

Build component to display single product summary.

- [x] 14.1: Create `src/components/ProductCard.tsx`
- [x] 14.2: Display product image placeholder
- [x] 14.3: Display product name, price, category badge
- [x] 14.4: Display stock status (in stock / low stock / out of stock)
- [x] 14.5: Implement click to navigate to ProductDetailPage
- [x] 14.6: Render AddToCartButton (disabled if out of stock)
- [x] 14.7: Add hover effect (shadow, scale)
- [x] 14.8: Make component responsive

---

## Section 15: Frontend — ProductDetail Page (8-10 tasks | 6-8 hours)

Build page for single product view.

- [x] 15.1: Create `src/pages/ProductDetailPage.tsx`
- [x] 15.2: Extract product ID from URL params
- [x] 15.3: Implement useProduct hook to fetch single product
- [x] 15.4: Display loading spinner while fetching
- [x] 15.5: Display product image placeholder
- [x] 15.6: Display full product info (name, description, price, category)
- [x] 15.7: Display inventory status with progress bar
- [x] 15.8: Render AddToCartButton with quantity selector
- [x] 15.9: Display related products (same category, limit 4)
- [x] 15.10: Handle 404 error (product not found)

---

## Section 16: Frontend — Hooks (useProducts, useFilters, useProduct) (6-8 tasks | 4-6 hours)

Implement custom React hooks for data fetching and state management.

- [x] 16.1: Create `src/hooks/useProducts.ts` hook
- [x] 16.2: Implement fetch with filters (category, search, price range)
- [x] 16.3: Add pagination support (page, limit)
- [x] 16.4: Add sorting support (field, order)
- [x] 16.5: Create `src/hooks/useFilters.ts` for filter state management
- [x] 16.6: Create `src/hooks/useProduct.ts` for single product fetch
- [x] 16.7: Implement error handling in all hooks
- [x] 16.8: Add debouncing to search queries (300ms)

---

## Section 17: Frontend — CategoryFilter Component (4-6 tasks | 2-4 hours)

Build filter component for categories.

- [x] 17.1: Create `src/components/CategoryFilter.tsx`
- [x] 17.2: Fetch and display all categories in dropdown
- [x] 17.3: Show "All Categories" option (null value)
- [x] 17.4: Emit callback on category selection
- [x] 17.5: Show product count per category (if available)

---

## Section 18: Frontend — SearchInput Component (4-6 tasks | 2-4 hours)

Build search component with debouncing.

- [x] 18.1: Create `src/components/SearchInput.tsx`
- [x] 18.2: Implement text input field
- [x] 18.3: Add debounce (300ms) before emitting search
- [x] 18.4: Clear button to reset search
- [x] 18.5: Accessibility: add aria-label, role=searchbox

---

## Section 19: Frontend — Pagination Component (3-4 tasks | 1-2 hours)

Build pagination controls.

- [x] 19.1: Create `src/components/Pagination.tsx`
- [x] 19.2: Show Previous/Next buttons
- [x] 19.3: Display current page and total pages
- [x] 19.4: Disable buttons at boundaries (first/last page)

---

## Section 20: Frontend — Additional Components (4-6 tasks | 2-4 hours)

Build supporting components (AddToCart, StockStatus, etc.).

- [x] 20.1: Create `src/components/AddToCartButton.tsx`
- [x] 20.2: Render quantity selector (-, quantity, +)
- [x] 20.3: Implement "Add to Cart" button with loading state
- [x] 20.4: Create `src/components/StockStatus.tsx`
- [x] 20.5: Display stock progress bar and availability badge
- [x] 20.6: Create `src/components/ProductCardSkeleton.tsx` for loading state

---

## Section 21: Frontend — ProductsPage (Main Browse Page) (6-8 tasks | 4-6 hours)

Build main product browsing page with filters and grid.

- [x] 21.1: Create `src/pages/ProductsPage.tsx`
- [x] 21.2: Integrate useProducts hook with pagination
- [x] 21.3: Integrate useFilters hook
- [x] 21.4: Add SearchInput and connect to filters
- [x] 21.5: Add CategoryFilter and connect to filters
- [x] 21.6: Render ProductGrid with filter results
- [x] 21.7: Sync filters to URL query params for browser history
- [x] 21.8: Restore filters from URL on page load

---

## Section 22: Frontend — Component Testing (8-10 tasks | 8-10 hours)

Write unit/integration tests for React components.

- [x] 22.1: Create `src/__tests__/ProductGrid.test.tsx`
- [x] 22.2: Test ProductGrid renders products correctly
- [x] 22.3: Test ProductGrid shows loading skeleton
- [x] 22.4: Test ProductGrid displays error state
- [x] 22.5: Test Pagination component
- [x] 22.6: Create `src/__tests__/ProductCard.test.tsx`
- [x] 22.7: Test ProductCard renders price, name, category
- [x] 22.8: Test StockStatus component shows correct badge
- [x] 22.9: Create `src/__tests__/ProductsPage.test.tsx`
- [x] 22.10: Test ProductsPage integrates filters + grid + pagination

---

## Section 23: Frontend — Hook Testing (6-8 tasks | 4-6 hours)

Write tests for custom hooks.

- [x] 23.1: Create `src/__tests__/useProducts.test.ts`
- [x] 23.2: Test useProducts hook fetches products
- [x] 23.3: Test useProducts with filters (category, price, search)
- [x] 23.4: Test useProducts error handling
- [x] 23.5: Create `src/__tests__/useFilters.test.ts`
- [x] 23.6: Test useFilters state management
- [x] 23.7: Create `src/__tests__/useProduct.test.ts`
- [x] 23.8: Test useProduct single product fetch

---

## Section 24: Frontend — API Integration (4-6 tasks | 2-4 hours)

Setup API client and mock service for testing.

- [x] 24.1: Create `src/api/productApi.ts` with fetch functions
- [x] 24.2: Implement `getProducts()`, `getProduct()`, `searchProducts()`
- [x] 24.3: Implement `createProduct()`, `updateProduct()`, `deleteProduct()`
- [x] 24.4: Add proper error handling and type safety
- [x] 24.5: Setup Mock Service Worker (MSW) for test mocking
- [x] 24.6: Create mock handlers for all product/category endpoints

---

## Section 25: Documentation & API Specs (6-8 tasks | 4-6 hours)

Document API endpoints and update project docs.

- [x] 25.1: Update `docs/ARCHITECTURE.md` with product service layer
- [x] 25.2: Add database schema diagram to `docs/`
- [x] 25.3: Document all API endpoints in `docs/API.md`
- [x] 25.4: Add example cURL requests for each endpoint
- [x] 25.5: Update `backend/README.md` with product service setup
- [x] 25.6: Add TypeScript types/interfaces to `src/types/product.ts`
- [x] 25.7: Update `AGENTS.md` with product service patterns
- [x] 25.8: Verify OpenAPI/Swagger documentation auto-generated correctly

---

## Section 26: Integration & E2E Tests (6-8 tasks | 6-8 hours)

Write end-to-end tests verifying full flow.

- [x] 26.1: Create `backend/tests/test_e2e_products.py`
- [x] 26.2: Test E2E: create product → list → get → update → delete
- [x] 26.3: Test E2E: create category → create product in category → filter → delete
- [x] 26.4: Test E2E: inventory update on product change
- [x] 26.5: Create `src/__tests__/e2e.test.tsx` with Playwright/Cypress
- [x] 26.6: Test E2E: user browse products → filter → view detail → add to cart
- [x] 26.7: Test E2E: admin create/update/delete product
- [x] 26.8: Verify 0 console errors/warnings in frontend

---

## Section 27: Performance & Optimization (4-6 tasks | 3-4 hours)

Optimize database queries and frontend rendering.

- [x] 27.1: Run `EXPLAIN ANALYZE` on all product queries
- [x] 27.2: Verify indexes are used (no sequential scans)
- [x] 27.3: Benchmark: GET /api/products with 1000 items (target <500ms)
- [x] 27.4: Measure N+1 queries (should be zero)
- [x] 27.5: Profile React component renders (React DevTools Profiler)
- [x] 27.6: Measure Lighthouse performance score
- [x] 27.7: Optimize: add React.memo() where appropriate
- [x] 27.8: Add performance benchmarks to CI

---

## Section 28: Final Testing & QA (8-10 tasks | 6-8 hours)

Comprehensive testing before merge.

- [x] 28.1: Run full backend test suite: `pytest backend/tests/`
- [x] 28.2: Run full frontend test suite: `npm run test --workspace frontend`
- [x] 28.3: Run linting: `npm run lint` (ESLint + Ruff)
- [x] 28.4: Run formatting check: `npm run format` (Prettier + Black)
- [x] 28.5: Run type check: `npm run typecheck` (tsc + mypy)
- [x] 28.6: Verify test coverage ≥90% backend, ≥85% frontend
- [x] 28.7: Manual testing: browse products, filter, search, pagination
- [x] 28.8: Manual testing: admin create/update/delete product
- [x] 28.9: Verify no TypeScript errors in frontend
- [x] 28.10: Test all endpoints with Swagger UI at http://localhost:8000/docs

---

## Section 29: Documentation Review & Merge Prep (4-6 tasks | 2-3 hours)

Final documentation and merge preparation.

- [x] 29.1: Update `GETTING-STARTED.md` with product service endpoints
- [x] 29.2: Add troubleshooting section for common issues
- [x] 29.3: Update `package.json` scripts if needed (dev, test, build)
- [x] 29.4: Create CHANGELOG.md entry for this change
- [x] 29.5: Review all commits for conventional commit format
- [x] 29.6: Verify no hardcoded URLs or secrets in code

---

## Summary of Effort by Section

| Section | Tasks | Hours | Focus |
|---------|-------|-------|-------|
| 1. Database Migrations | 10 | 6-8 | Infrastructure |
| 2. ORM Models | 10 | 6-8 | Data layer |
| 3. Pydantic Schemas | 8 | 4-6 | Validation |
| 4. Category Endpoints | 10 | 6-8 | API |
| 5. Product Endpoints | 12 | 8-10 | API |
| 6. Additional Endpoints | 8 | 4-6 | API |
| 7. Inventory Management | 8 | 4-6 | API |
| 8. Query Optimization | 8 | 4-6 | Performance |
| 9. Error Handling | 8 | 4-6 | Quality |
| 10. Unit Tests | 8 | 6-8 | Testing |
| 11. Route Tests | 15 | 10-12 | Testing |
| 12. Advanced Tests | 10 | 8-10 | Testing |
| 13. ProductGrid Comp | 10 | 6-8 | Frontend |
| 14. ProductCard Comp | 8 | 4-6 | Frontend |
| 15. ProductDetail Page | 10 | 6-8 | Frontend |
| 16. Hooks | 8 | 4-6 | Frontend |
| 17. CategoryFilter | 5 | 2-4 | Frontend |
| 18. SearchInput | 5 | 2-4 | Frontend |
| 19. Pagination | 4 | 1-2 | Frontend |
| 20. Aux Components | 6 | 2-4 | Frontend |
| 21. ProductsPage | 8 | 4-6 | Frontend |
| 22. Component Tests | 10 | 8-10 | Testing |
| 23. Hook Tests | 8 | 4-6 | Testing |
| 24. API Integration | 6 | 2-4 | Integration |
| 25. Documentation | 8 | 4-6 | Docs |
| 26. E2E Tests | 8 | 6-8 | Testing |
| 27. Performance | 8 | 3-4 | Optimization |
| 28. QA Testing | 10 | 6-8 | Quality |
| 29. Merge Prep | 6 | 2-3 | Admin |
| **TOTAL** | **~260** | **70-87** | **Full service** |

---

## Task Execution Tips

1. **Start with database** (Sections 1-2) — Everything depends on schema
2. **Implement backend** (Sections 3-12) — Build API before UI
3. **Test backend thoroughly** — Sections 10-12 include comprehensive tests
4. **Build frontend components** (Sections 13-24) — React UI reuses hooks
5. **Test early, test often** — Don't batch tests at the end
6. **Document as you go** — Section 25 captures existing docs
7. **Performance matters** — Section 27 prevents tech debt
8. **QA before merge** — Section 28 is non-negotiable

---

## Commit Message Format (Conventional Commits)

When committing:
- `feat(products): add product service CRUD endpoints`
- `test(products): add route tests for product endpoints`
- `docs(products): document API endpoints and schemas`
- `refactor(products): extract inventory logic to separate module`
- `perf(products): add indexes for product list queries`

---

## Success Criteria (Before Merging)

- ✅ All 260 tasks completed
- ✅ Backend test coverage ≥90%
- ✅ Frontend test coverage ≥85%
- ✅ Zero console errors/warnings
- ✅ All endpoints documented in OpenAPI
- ✅ Database migrations run cleanly
- ✅ No N+1 queries in product endpoints
- ✅ Product list loads <500ms with 1000 items
- ✅ All commits follow conventional commit format
- ✅ Code review approved by at least one team member
