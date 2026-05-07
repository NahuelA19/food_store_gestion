# Change 5: Create Product Service

**Status**: Proposed  
**Version**: 1.0  
**Target Milestone**: Phase 2  
**Depends On**: Change 2 (Database Layer)

---

## What We're Building

A complete product management service with CRUD operations, category management, and inventory tracking. This includes:

- **Backend**: FastAPI routes for full product lifecycle (create, read, update, delete, search, filter)
- **Database**: Product, Category, and Inventory tables with relationships and indexes
- **Frontend**: React components for browsing, filtering, and viewing product details
- **Search & Filter**: Efficient product discovery by category, price, availability
- **Inventory**: Stock level tracking and management

---

## Why We Need This

Product management is a **core e-commerce feature** that enables:

1. **Catalog Management** — Merchants can add/update products and organize by category
2. **Customer Discovery** — Shoppers can browse, search, and filter the catalog
3. **Cart Integration** — Products are displayed before checkout (Change 6 depends on this)
4. **Inventory Control** — Track stock levels to prevent overselling
5. **Platform Foundation** — All other e-commerce features (reviews, recommendations, orders) depend on a solid product service

Without this, the Food Store has no catalog to sell.

---

## Goals

- ✅ Full CRUD operations for products (POST, GET, PUT, DELETE)
- ✅ Category management (CRUD + relationships)
- ✅ Inventory management (stock tracking, reservations)
- ✅ Product search and filtering (by category, price range, availability)
- ✅ Pagination for product listings
- ✅ React UI components (ProductGrid, ProductCard, ProductDetail, CategoryFilter)
- ✅ Error handling (404s, validation errors, business logic errors)
- ✅ Performance (indexing, efficient queries, pagination)
- ✅ Comprehensive test coverage (backend + frontend)
- ✅ API documentation (OpenAPI/Swagger)

---

## Non-Goals (Future Changes)

- Product recommendations (machine learning, personalization)
- User reviews and ratings (Change 7)
- Advanced search (elasticsearch, full-text search)
- Product images/media (file storage, CDN)
- Bulk import/export (CSV, data migration)
- Admin dashboard (separate change)

---

## Success Metrics

**Functional**:
- All 8+ backend endpoints tested and working
- All React components render correctly with real data
- Product search returns results within 100ms (p95)
- No N+1 queries in product listings

**Quality**:
- ≥90% test coverage for backend routes
- ≥85% test coverage for React components
- Zero console errors/warnings in frontend
- All TypeScript strict mode checks pass

**Performance**:
- GET /products with 1000 products loads in <500ms
- Category filtering works smoothly with 100 products per page
- No unindexed queries in product lookups

---

## Dependencies

| Dependency | Status | Notes |
|-----------|--------|-------|
| Change 2: Database Layer | ✅ Complete | SQLAlchemy ORM, asyncpg, Alembic migrations |
| PostgreSQL tables | ✅ Complete | categories, products, inventory exist |
| FastAPI app structure | ✅ Complete | Routes, models, dependencies ready |
| React 18 + TypeScript | ✅ Complete | Frontend environment ready |

---

## Scope & Effort Estimate

| Section | Estimate | Notes |
|---------|----------|-------|
| Database & ORM models | 6-8 hours | Relationships, migrations, indexes |
| Backend validation schemas | 4-6 hours | Pydantic models for requests/responses |
| Backend API endpoints | 10-12 hours | 8 routes + error handling |
| Backend tests | 12-15 hours | Happy-path + edge cases + integration |
| Frontend components | 14-16 hours | ProductGrid, Card, Detail, Filter |
| Frontend hooks & state | 6-8 hours | useProducts, useFilters, useDetail |
| Frontend tests | 12-14 hours | Component + integration tests |
| Documentation & E2E | 6-8 hours | API docs, README, e2e tests |
| **Total** | **70-87 hours** | ~2 weeks for 1 developer |

---

## Acceptance Criteria

### Backend
- [ ] Database schema migrations run without errors
- [ ] All Pydantic schemas validate correctly
- [ ] All 8 backend endpoints respond with correct status codes
- [ ] Product search works with filters and pagination
- [ ] Inventory levels update correctly on product changes
- [ ] All error cases (404, validation) return proper HTTP responses
- [ ] Backend test coverage ≥90%

### Frontend
- [ ] ProductGrid displays 20 products per page
- [ ] ProductCard shows product info and add-to-cart button
- [ ] ProductDetail page loads full product info + inventory
- [ ] CategoryFilter dropdown filters products correctly
- [ ] Search input filters products as user types
- [ ] Pagination works across all views
- [ ] Frontend test coverage ≥85%

### Documentation
- [ ] API endpoints documented in OpenAPI/Swagger
- [ ] Component prop interfaces documented
- [ ] Database schema diagram in docs/
- [ ] README updated with product service endpoints
- [ ] Architecture decision recorded in AGENTS.md

---

## Implementation Timeline

**Phase 1 (Days 1-2)**: Database schema and ORM models  
**Phase 2 (Days 2-3)**: Backend validation schemas and error handling  
**Phase 3 (Days 4-5)**: Backend API endpoints + unit tests  
**Phase 4 (Days 6-7)**: Frontend components and hooks  
**Phase 5 (Days 8)**: Frontend integration + E2E tests + documentation  

---

## Collaboration & Review

- **Review Checklist**: See design.md for architecture decisions
- **API Contract**: See specs/product-api.md for endpoint specifications
- **Component Specs**: See specs/frontend-product-ui.md for UI requirements
- **Testing Strategy**: See tasks.md for test plan

---

## Notes

- Database migrations are managed by Alembic; all schema changes must include migration files
- Frontend components use React 18 with hooks; no class components
- All async database operations use asyncpg driver; follow the established patterns in Change 2
- Error messages must be user-friendly and localized (prepare for i18n in future change)
