# Change 5: Product Service — Implementation Tasks

**Total Effort Estimate**: 70-87 hours (~2 weeks)  
**Format**: Numbered checklist with `- [ ]` checkboxes

---

## Section 1: Database Schema & Migrations (8-10 tasks | 6-8 hours)

Create Alembic migrations for new tables and indexes. These tasks assume Change 2 (database layer) is complete and categories/products tables exist.

- [ ] 1.1: Create Alembic migration file for `inventory` table
- [ ] 1.2: Add migration `CREATE TABLE inventory` with all columns and constraints
- [ ] 1.3: Add index on `inventory.product_id` (unique constraint)
- [ ] 1.4: Add index on `inventory.stock_quantity` for filtering
- [ ] 1.5: Add index on `products.name` for search (if not already present)
- [ ] 1.6: Add index on `products.category_id` (if not already present)
- [ ] 1.7: Add index on `products.price` for price range filtering
- [ ] 1.8: Add index on `products.is_available` for availability filtering
- [ ] 1.9: Run `alembic upgrade head` and verify tables exist
- [ ] 1.10: Create database seed script with sample categories and products

---

## Section 2: ORM Models & Relationships (8-10 tasks | 6-8 hours)

Define SQLAlchemy models with proper relationships, lazy loading, and cascades.

- [ ] 2.1: Create `app/models/inventory.py` with `Inventory` class
- [ ] 2.2: Add all columns to Inventory model (product_id, stock_quantity, reserved_quantity, etc.)
- [ ] 2.3: Add `TimestampMixin` to Inventory model
- [ ] 2.4: Add relationship `Inventory.product` with back_populates
- [ ] 2.5: Update Product model: add `inventory` relationship (one-to-one)
- [ ] 2.6: Add lazy loading `selectinload` to Product.category
- [ ] 2.7: Add lazy loading `selectinload` to Product.inventory
- [ ] 2.8: Update Category model: ensure `products` relationship has `selectinload`
- [ ] 2.9: Add `@property available_quantity` to Inventory (calculated)
- [ ] 2.10: Test ORM models: create product + inventory, verify relationships load

---

## Section 3: Pydantic Validation Schemas (6-8 tasks | 4-6 hours)

Create request/response schemas for all endpoints with proper validation.

- [ ] 3.1: Create `app/models/schemas.py` with all Pydantic models
- [ ] 3.2: Implement `ProductCreate` schema with validation rules
- [ ] 3.3: Implement `ProductUpdate` schema (all fields optional)
- [ ] 3.4: Implement `ProductResponse` schema with nested Category
- [ ] 3.5: Implement `InventoryResponse` schema with available_quantity
- [ ] 3.6: Implement `ProductDetailResponse` (includes full inventory)
- [ ] 3.7: Implement `CategoryCreate`, `CategoryUpdate`, `CategoryResponse` schemas
- [ ] 3.8: Add ConfigDict with `from_attributes=True` to all response models

---

## Section 4: Category API Endpoints (8-10 tasks | 6-8 hours)

Implement CRUD endpoints for categories. Reuse existing category model if present.

- [ ] 4.1: Create `app/routes/categories.py` with router setup
- [ ] 4.2: Implement `GET /api/categories` — list all categories with product count
- [ ] 4.3: Add pagination/limit parameters to category list endpoint
- [ ] 4.4: Implement `GET /api/categories/{id}` — get category with products
- [ ] 4.5: Implement `POST /api/categories` — create category (admin only)
- [ ] 4.6: Add validation: reject duplicate category names (409 Conflict)
- [ ] 4.7: Implement `PUT /api/categories/{id}` — update category (admin only)
- [ ] 4.8: Implement `DELETE /api/categories/{id}` — delete category (admin only)
- [ ] 4.9: Add business logic: prevent deletion if category has products
- [ ] 4.10: Register category router in `app/main.py`

---

## Section 5: Product API Endpoints (10-12 tasks | 8-10 hours)

Implement full CRUD + search/filter endpoints for products.

- [ ] 5.1: Create `app/routes/products.py` with router setup
- [ ] 5.2: Implement `GET /api/products` — list with pagination
- [ ] 5.3: Add category_id filter to product list
- [ ] 5.4: Add price range filters (min_price, max_price) to product list
- [ ] 5.5: Add search parameter (by name) to product list
- [ ] 5.6: Add in_stock filter (availability) to product list
- [ ] 5.7: Add sorting (name, price, created_at) + order (asc/desc) to product list
- [ ] 5.8: Implement `GET /api/products/{id}` — get single product with inventory
- [ ] 5.9: Implement `POST /api/products` — create product (admin only)
- [ ] 5.10: Auto-create inventory record when product is created (stock_quantity=0)
- [ ] 5.11: Implement `PUT /api/products/{id}` — update product (admin only)
- [ ] 5.12: Implement `DELETE /api/products/{id}` — delete product (admin only, cascade to inventory)

---

## Section 6: Additional Product Endpoints (6-8 tasks | 4-6 hours)

Implement search, related products, and availability toggle endpoints.

- [ ] 6.1: Implement `GET /api/products/search?q=query` — search by name
- [ ] 6.2: Add pagination to search results
- [ ] 6.3: Implement `GET /api/products/{id}/related` — get products in same category
- [ ] 6.4: Limit related products to top 4 (exclude requested product)
- [ ] 6.5: Implement `PUT /api/products/{id}/availability` — toggle is_available flag
- [ ] 6.6: Ensure availability changes don't affect inventory levels
- [ ] 6.7: Return proper error responses (404, 400, 403) for all endpoints
- [ ] 6.8: Test all product endpoints with admin + non-admin users

---

## Section 7: Inventory Management (6-8 tasks | 4-6 hours)

Implement inventory tracking and stock management endpoints.

- [ ] 7.1: Create inventory endpoints in routes or add to products
- [ ] 7.2: Implement `GET /api/inventory/{product_id}` — get stock levels
- [ ] 7.3: Implement `PUT /api/inventory/{product_id}` — update stock quantity (admin)
- [ ] 7.4: Implement `POST /api/inventory/{product_id}/reserve` — reserve stock
- [ ] 7.5: Add validation: cannot reserve more than available_quantity
- [ ] 7.6: Add validation: stock_quantity must be >= reserved_quantity
- [ ] 7.7: Calculate available_quantity = stock_quantity - reserved_quantity
- [ ] 7.8: Return 400 if trying to set stock below reserved amount

---

## Section 8: Query Optimization & Pagination (6-8 tasks | 4-6 hours)

Ensure efficient queries with pagination, indexes, and eager loading.

- [ ] 8.1: Use `selectinload()` for Product.category and Product.inventory relationships
- [ ] 8.2: Add default pagination (page=1, limit=20, max=100)
- [ ] 8.3: Implement OFFSET/LIMIT in all list endpoints
- [ ] 8.4: Add query parameter validation (page >= 1, limit 1-100)
- [ ] 8.5: Test `EXPLAIN ANALYZE` on product list query with filters
- [ ] 8.6: Verify indexes exist for category_id, is_available, price
- [ ] 8.7: Test N+1 prevention (ensure one query for products + relationships)
- [ ] 8.8: Add response pagination metadata (total, page, total_pages, has_next, has_previous)

---

## Section 9: Error Handling & Validation (6-8 tasks | 4-6 hours)

Implement consistent error responses and validation.

- [ ] 9.1: Create error response model (detail, error_code, status_code)
- [ ] 9.2: Handle 404 errors (product/category not found)
- [ ] 9.3: Handle 400 errors (validation failures)
- [ ] 9.4: Handle 401 errors (authentication required)
- [ ] 9.5: Handle 403 errors (admin-only endpoints)
- [ ] 9.6: Handle 409 errors (business logic violations, duplicate names)
- [ ] 9.7: Add HTTPException with proper status codes for all error cases
- [ ] 9.8: Test error response format in all endpoints

---

## Section 10: Backend Testing — Unit Tests (6-8 tasks | 6-8 hours)

Write unit tests for Pydantic schemas and model methods.

- [ ] 10.1: Create `backend/tests/test_schemas.py`
- [ ] 10.2: Test ProductCreate schema validation (valid/invalid inputs)
- [ ] 10.3: Test ProductUpdate schema (optional fields)
- [ ] 10.4: Test CategoryCreate schema (unique name validation)
- [ ] 10.5: Test InventoryResponse schema (available_quantity calculation)
- [ ] 10.6: Test that invalid prices (negative, >2 decimals) are rejected
- [ ] 10.7: Test that invalid category_id is rejected
- [ ] 10.8: Verify schemas serialize correctly with ConfigDict(from_attributes=True)

---

## Section 11: Backend Testing — Route Tests (12-15 tasks | 10-12 hours)

Write integration tests for all endpoints.

- [ ] 11.1: Create `backend/tests/test_categories.py` with fixtures
- [ ] 11.2: Test GET /api/categories — happy path (returns all categories)
- [ ] 11.3: Test GET /api/categories/{id} — happy path + 404
- [ ] 11.4: Test POST /api/categories — create + verify inventory not created
- [ ] 11.5: Test POST /api/categories — duplicate name returns 409
- [ ] 11.6: Test POST /api/categories — requires admin role (403 for non-admin)
- [ ] 11.7: Test PUT /api/categories/{id} — update fields
- [ ] 11.8: Test DELETE /api/categories/{id} — verify cascade/constraints
- [ ] 11.9: Create `backend/tests/test_products.py` with fixtures
- [ ] 11.10: Test GET /api/products — returns paginated list
- [ ] 11.11: Test GET /api/products?category_id=1 — filter by category
- [ ] 11.12: Test GET /api/products?min_price=2&max_price=5 — price range
- [ ] 11.13: Test GET /api/products?in_stock=true — availability filter
- [ ] 11.14: Test GET /api/products/{id} — includes inventory + category
- [ ] 11.15: Test POST /api/products — create + auto-create inventory with 0 stock

---

## Section 12: Backend Testing — Advanced Tests (8-10 tasks | 8-10 hours)

Write tests for search, related products, inventory, and edge cases.

- [ ] 12.1: Test POST /api/products — invalid category_id returns 400
- [ ] 12.2: Test PUT /api/products/{id} — partial update
- [ ] 12.3: Test DELETE /api/products/{id} — cascade to inventory
- [ ] 12.4: Test GET /api/products/search?q=tomato — search functionality
- [ ] 12.5: Test GET /api/products/{id}/related — returns products in category
- [ ] 12.6: Test PUT /api/products/{id}/availability — toggle flag
- [ ] 12.7: Test GET /api/inventory/{product_id} — returns stock levels
- [ ] 12.8: Test PUT /api/inventory/{product_id} — update stock (admin only)
- [ ] 12.9: Test POST /api/inventory/{product_id}/reserve — reserve stock
- [ ] 12.10: Test inventory validation (cannot reserve > available)

---

## Section 13: Frontend — ProductGrid Component (8-10 tasks | 6-8 hours)

Build component to display paginated product list.

- [ ] 13.1: Create `src/components/ProductGrid.tsx`
- [ ] 13.2: Accept props: products[], isLoading, error, onPageChange, currentPage, totalPages
- [ ] 13.3: Render loading skeleton while fetching
- [ ] 13.4: Render grid layout (1 col mobile, 2 col tablet, 4 col desktop)
- [ ] 13.5: Render ProductCard for each product
- [ ] 13.6: Display error state with retry button if loading fails
- [ ] 13.7: Render Pagination component below grid
- [ ] 13.8: Use React.memo() to prevent unnecessary re-renders
- [ ] 13.9: Add accessibility attributes (role, aria-labels)
- [ ] 13.10: Test component renders with sample products

---

## Section 14: Frontend — ProductCard Component (6-8 tasks | 4-6 hours)

Build component to display single product summary.

- [ ] 14.1: Create `src/components/ProductCard.tsx`
- [ ] 14.2: Display product image placeholder
- [ ] 14.3: Display product name, price, category badge
- [ ] 14.4: Display stock status (in stock / low stock / out of stock)
- [ ] 14.5: Implement click to navigate to ProductDetailPage
- [ ] 14.6: Render AddToCartButton (disabled if out of stock)
- [ ] 14.7: Add hover effect (shadow, scale)
- [ ] 14.8: Make component responsive

---

## Section 15: Frontend — ProductDetail Page (8-10 tasks | 6-8 hours)

Build page for single product view.

- [ ] 15.1: Create `src/pages/ProductDetailPage.tsx`
- [ ] 15.2: Extract product ID from URL params
- [ ] 15.3: Implement useProduct hook to fetch single product
- [ ] 15.4: Display loading spinner while fetching
- [ ] 15.5: Display product image placeholder
- [ ] 15.6: Display full product info (name, description, price, category)
- [ ] 15.7: Display inventory status with progress bar
- [ ] 15.8: Render AddToCartButton with quantity selector
- [ ] 15.9: Display related products (same category, limit 4)
- [ ] 15.10: Handle 404 error (product not found)

---

## Section 16: Frontend — Hooks (useProducts, useFilters, useProduct) (6-8 tasks | 4-6 hours)

Implement custom React hooks for data fetching and state management.

- [ ] 16.1: Create `src/hooks/useProducts.ts` hook
- [ ] 16.2: Implement fetch with filters (category, search, price range)
- [ ] 16.3: Add pagination support (page, limit)
- [ ] 16.4: Add sorting support (field, order)
- [ ] 16.5: Create `src/hooks/useFilters.ts` for filter state management
- [ ] 16.6: Create `src/hooks/useProduct.ts` for single product fetch
- [ ] 16.7: Implement error handling in all hooks
- [ ] 16.8: Add debouncing to search queries (300ms)

---

## Section 17: Frontend — CategoryFilter Component (4-6 tasks | 2-4 hours)

Build filter component for categories.

- [ ] 17.1: Create `src/components/CategoryFilter.tsx`
- [ ] 17.2: Fetch and display all categories in dropdown
- [ ] 17.3: Show "All Categories" option (null value)
- [ ] 17.4: Emit callback on category selection
- [ ] 17.5: Show product count per category (if available)

---

## Section 18: Frontend — SearchInput Component (4-6 tasks | 2-4 hours)

Build search component with debouncing.

- [ ] 18.1: Create `src/components/SearchInput.tsx`
- [ ] 18.2: Implement text input field
- [ ] 18.3: Add debounce (300ms) before emitting search
- [ ] 18.4: Clear button to reset search
- [ ] 18.5: Accessibility: add aria-label, role=searchbox

---

## Section 19: Frontend — Pagination Component (3-4 tasks | 1-2 hours)

Build pagination controls.

- [ ] 19.1: Create `src/components/Pagination.tsx`
- [ ] 19.2: Show Previous/Next buttons
- [ ] 19.3: Display current page and total pages
- [ ] 19.4: Disable buttons at boundaries (first/last page)

---

## Section 20: Frontend — Additional Components (4-6 tasks | 2-4 hours)

Build supporting components (AddToCart, StockStatus, etc.).

- [ ] 20.1: Create `src/components/AddToCartButton.tsx`
- [ ] 20.2: Render quantity selector (-, quantity, +)
- [ ] 20.3: Implement "Add to Cart" button with loading state
- [ ] 20.4: Create `src/components/StockStatus.tsx`
- [ ] 20.5: Display stock progress bar and availability badge
- [ ] 20.6: Create `src/components/ProductCardSkeleton.tsx` for loading state

---

## Section 21: Frontend — ProductsPage (Main Browse Page) (6-8 tasks | 4-6 hours)

Build main product browsing page with filters and grid.

- [ ] 21.1: Create `src/pages/ProductsPage.tsx`
- [ ] 21.2: Integrate useProducts hook with pagination
- [ ] 21.3: Integrate useFilters hook
- [ ] 21.4: Add SearchInput and connect to filters
- [ ] 21.5: Add CategoryFilter and connect to filters
- [ ] 21.6: Render ProductGrid with filter results
- [ ] 21.7: Sync filters to URL query params for browser history
- [ ] 21.8: Restore filters from URL on page load

---

## Section 22: Frontend — Component Testing (8-10 tasks | 8-10 hours)

Write unit/integration tests for React components.

- [ ] 22.1: Create `src/__tests__/ProductGrid.test.tsx`
- [ ] 22.2: Test ProductGrid renders products correctly
- [ ] 22.3: Test ProductGrid shows loading skeleton
- [ ] 22.4: Test ProductGrid displays error state
- [ ] 22.5: Test Pagination component
- [ ] 22.6: Create `src/__tests__/ProductCard.test.tsx`
- [ ] 22.7: Test ProductCard renders price, name, category
- [ ] 22.8: Test StockStatus component shows correct badge
- [ ] 22.9: Create `src/__tests__/ProductsPage.test.tsx`
- [ ] 22.10: Test ProductsPage integrates filters + grid + pagination

---

## Section 23: Frontend — Hook Testing (6-8 tasks | 4-6 hours)

Write tests for custom hooks.

- [ ] 23.1: Create `src/__tests__/useProducts.test.ts`
- [ ] 23.2: Test useProducts hook fetches products
- [ ] 23.3: Test useProducts with filters (category, price, search)
- [ ] 23.4: Test useProducts error handling
- [ ] 23.5: Create `src/__tests__/useFilters.test.ts`
- [ ] 23.6: Test useFilters state management
- [ ] 23.7: Create `src/__tests__/useProduct.test.ts`
- [ ] 23.8: Test useProduct single product fetch

---

## Section 24: Frontend — API Integration (4-6 tasks | 2-4 hours)

Setup API client and mock service for testing.

- [ ] 24.1: Create `src/api/productApi.ts` with fetch functions
- [ ] 24.2: Implement `getProducts()`, `getProduct()`, `searchProducts()`
- [ ] 24.3: Implement `createProduct()`, `updateProduct()`, `deleteProduct()`
- [ ] 24.4: Add proper error handling and type safety
- [ ] 24.5: Setup Mock Service Worker (MSW) for test mocking
- [ ] 24.6: Create mock handlers for all product/category endpoints

---

## Section 25: Documentation & API Specs (6-8 tasks | 4-6 hours)

Document API endpoints and update project docs.

- [ ] 25.1: Update `docs/ARCHITECTURE.md` with product service layer
- [ ] 25.2: Add database schema diagram to `docs/`
- [ ] 25.3: Document all API endpoints in `docs/API.md`
- [ ] 25.4: Add example cURL requests for each endpoint
- [ ] 25.5: Update `backend/README.md` with product service setup
- [ ] 25.6: Add TypeScript types/interfaces to `src/types/product.ts`
- [ ] 25.7: Update `AGENTS.md` with product service patterns
- [ ] 25.8: Verify OpenAPI/Swagger documentation auto-generated correctly

---

## Section 26: Integration & E2E Tests (6-8 tasks | 6-8 hours)

Write end-to-end tests verifying full flow.

- [ ] 26.1: Create `backend/tests/test_e2e_products.py`
- [ ] 26.2: Test E2E: create product → list → get → update → delete
- [ ] 26.3: Test E2E: create category → create product in category → filter → delete
- [ ] 26.4: Test E2E: inventory update on product change
- [ ] 26.5: Create `src/__tests__/e2e.test.tsx` with Playwright/Cypress
- [ ] 26.6: Test E2E: user browse products → filter → view detail → add to cart
- [ ] 26.7: Test E2E: admin create/update/delete product
- [ ] 26.8: Verify 0 console errors/warnings in frontend

---

## Section 27: Performance & Optimization (4-6 tasks | 3-4 hours)

Optimize database queries and frontend rendering.

- [ ] 27.1: Run `EXPLAIN ANALYZE` on all product queries
- [ ] 27.2: Verify indexes are used (no sequential scans)
- [ ] 27.3: Benchmark: GET /api/products with 1000 items (target <500ms)
- [ ] 27.4: Measure N+1 queries (should be zero)
- [ ] 27.5: Profile React component renders (React DevTools Profiler)
- [ ] 27.6: Measure Lighthouse performance score
- [ ] 27.7: Optimize: add React.memo() where appropriate
- [ ] 27.8: Add performance benchmarks to CI

---

## Section 28: Final Testing & QA (8-10 tasks | 6-8 hours)

Comprehensive testing before merge.

- [ ] 28.1: Run full backend test suite: `pytest backend/tests/`
- [ ] 28.2: Run full frontend test suite: `npm run test --workspace frontend`
- [ ] 28.3: Run linting: `npm run lint` (ESLint + Ruff)
- [ ] 28.4: Run formatting check: `npm run format` (Prettier + Black)
- [ ] 28.5: Run type check: `npm run typecheck` (tsc + mypy)
- [ ] 28.6: Verify test coverage ≥90% backend, ≥85% frontend
- [ ] 28.7: Manual testing: browse products, filter, search, pagination
- [ ] 28.8: Manual testing: admin create/update/delete product
- [ ] 28.9: Verify no TypeScript errors in frontend
- [ ] 28.10: Test all endpoints with Swagger UI at http://localhost:8000/docs

---

## Section 29: Documentation Review & Merge Prep (4-6 tasks | 2-3 hours)

Final documentation and merge preparation.

- [ ] 29.1: Update `GETTING-STARTED.md` with product service endpoints
- [ ] 29.2: Add troubleshooting section for common issues
- [ ] 29.3: Update `package.json` scripts if needed (dev, test, build)
- [ ] 29.4: Create CHANGELOG.md entry for this change
- [ ] 29.5: Review all commits for conventional commit format
- [ ] 29.6: Verify no hardcoded URLs or secrets in code

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
