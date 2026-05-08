## Context

Previous changes have established a solid foundation:
- **Change 3** (Authentication): JWT-based user login/registration with secure password hashing
- **Change 4** (User Service): User profiles with metadata and preferences
- **Change 5** (Product Catalog): Product listing with categories, pricing, and inventory tracking
- **Change 6** (Search & Filtering): Full-text search and advanced filtering on products

The shopping cart is the next critical piece—it bridges the product discovery phase with the checkout/ordering phase. Users can now select items and prepare them for purchase, laying the groundwork for Change 8 (Order Placement & Payment).

## Goals / Non-Goals

**Goals:**
- Design persistent shopping cart storage using PostgreSQL (not ephemeral localStorage)
- Implement REST API endpoints for full CRUD operations on cart and cart items
- Manage cart state on the frontend with React Context API and custom hooks
- Provide real-time cart updates (add/remove/update quantities)
- Validate cart items before adding (product exists, is active, quantity available)
- Calculate and display cart totals (subtotal, potential tax/shipping—defer calculation logic to Change 8)
- Support authenticated users only (guest checkout deferred to later change)
- Ensure cart persists across sessions and devices for authenticated users

**Non-Goals:**
- Payment processing and transaction handling (deferred to Change 8: Order Placement)
- Inventory management / real-time stock decrementing (cart doesn't consume stock; that happens at checkout)
- Cart sharing, gift cart links, or collaborative shopping
- "Save for Later" / wishlist features (separate from cart)
- Abandoned cart recovery / email campaigns
- Guest user carts (authentication required for now)
- Cart item serialization into orders (belongs to order placement flow)

## Decisions

### 1. Cart Storage Strategy

**Decision: Hybrid Approach — Database-Persistent for Auth'd Users Only**

**Rationale:**
- Authenticated users get persistent carts synced across devices/sessions (database-backed)
- Guests must authenticate before checkout (simplifies data model, reduces complexity)
- Cart state owned by backend; frontend is stateless client

**Options Considered:**
- **Option A: Database Only** ✅ Chosen
  - Pros: Persistent, device-agnostic, auditable, enables analytics
  - Cons: Requires DB round-trip for every cart read
  
- **Option B: localStorage Only** ❌ Rejected
  - Pros: No backend calls, instant updates, offline support
  - Cons: Lost on browser clear, not synced across devices, vulnerable to tampering
  
- **Option C: Hybrid (DB + localStorage cache)**
  - Pros: Best UX (fast reads), persistent backup
  - Cons: Complexity of sync conflicts, stale data risk
  - **Decision**: Defer this optimization to future iteration if performance becomes concern

**Implementation Details:**
- Cart created in database when user logs in or on first add-to-cart
- Cart persists indefinitely (or until user explicitly clears it)
- CartItems are mutable—quantity updates are PATCH operations, not inserts
- No inventory decrement until checkout (cart is "hold", not "reservation")

---

### 2. Cart State Management (Frontend)

**Decision: React Context API + Custom Hook Pattern**

**Rationale:**
- Avoid Redux/Zustand complexity for a relatively simple domain (cart is single entity with CRUD operations)
- Custom hooks provide reusability and testability
- Context API is built-in to React, no external dependencies
- Pattern scales to complexity we need without over-engineering

**Architecture:**
```
CartContext (provides cart state + dispatch)
  ↓
useCart hook (exposes: getCart, addItem, removeItem, updateQuantity, clearCart)
  ↓
Components consume via useCart()
```

**Implementation Details:**
- **CartContext** stores: `cart`, `loading`, `error`, `initialized`
- **useCart hook** abstracts API calls and state updates
- **Optimistic updates**: UI updates immediately, then syncs with backend (improves perceived performance)
- **Error handling**: Fallback to previous state if API call fails
- Persist minimal state to localStorage as cache (load on app boot, validate against backend)

---

### 3. API Design (Backend)

**Decision: RESTful Endpoints with Resource-Oriented URLs**

**Endpoints:**

| Method | URL | Purpose | Request | Response |
|--------|-----|---------|---------|----------|
| GET | `/api/v1/cart` | Fetch current user's cart | - | CartResponse (with items) |
| POST | `/api/v1/cart/items` | Add product to cart | `{ product_id, quantity }` | CartItemResponse |
| PATCH | `/api/v1/cart/items/{item_id}` | Update item quantity | `{ quantity }` | CartItemResponse |
| DELETE | `/api/v1/cart/items/{item_id}` | Remove item from cart | - | 204 No Content |
| POST | `/api/v1/cart/checkout` | Validate cart, initiate checkout | - | CheckoutResponse (total, items count) |

**Request/Response Schemas** (Pydantic):

```python
# Request Models
class AddCartItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, le=999)

class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(gt=0, le=999)

# Response Models
class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    price: Decimal
    quantity: int
    subtotal: Decimal  # price * quantity
    
class CartResponse(BaseModel):
    id: int
    user_id: int
    items: list[CartItemResponse]
    total_items: int  # sum of quantities
    subtotal: Decimal
    created_at: datetime
    updated_at: datetime

class CheckoutResponse(BaseModel):
    cart_id: int
    item_count: int
    subtotal: Decimal
    ready_for_checkout: bool
```

**Error Handling:**
- `400 Bad Request`: Invalid quantity or product_id
- `404 Not Found`: Product doesn't exist, item not in cart
- `409 Conflict`: Product out of stock or inactive
- `401 Unauthorized`: User not authenticated

---

### 4. Database Schema

**New Tables:**

```sql
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_carts_user_id (user_id),
    INDEX idx_carts_expires_at (expires_at)
);

CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (cart_id, product_id),  -- One product per cart only
    INDEX idx_cart_items_cart_id (cart_id),
    INDEX idx_cart_items_product_id (product_id)
);
```

**Key Design Decisions:**
- **One cart per user**: `UNIQUE` constraint on `user_id` simplifies queries
- **One product per cart**: `UNIQUE(cart_id, product_id)` prevents duplicate entries; updates use PATCH instead
- **unit_price stored**: Snapshot price at time of add-to-cart (price may change, cart shows historical price)
- **expires_at nullable**: Cart persists until explicitly cleared or user deletes account
- **ON DELETE RESTRICT for product**: Prevent deletion of products that are in active carts (data integrity)
- **ON DELETE CASCADE for user/cart**: Cascade delete for data cleanup

**ORM Models (SQLAlchemy)**:

```python
class Cart(Base, TimestampMixin):
    __tablename__ = "carts"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    user: Mapped["User"] = relationship("User")
    items: Mapped[list["CartItem"]] = relationship(
        "CartItem", back_populates="cart", cascade="all, delete-orphan"
    )

class CartItem(Base, TimestampMixin):
    __tablename__ = "cart_items"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    cart_id: Mapped[int] = mapped_column(
        ForeignKey("carts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    quantity: Mapped[int] = mapped_column(nullable=False, server_default="1")
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    
    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
    product: Mapped["Product"] = relationship("Product")
```

---

### 5. Cart Item Validation

**Decision: Multi-Stage Validation with Clear Responsibility Boundaries**

**Validation Flow:**

```
User submits add-to-cart
    ↓
[Stage 1: Input Validation]
  - Quantity: required, > 0, <= 999
  - product_id: required, valid integer
  - Pydantic validates request schema
    ↓
[Stage 2: Business Logic Validation]
  - Product exists? (404 if not)
  - Product is_available? (409 if inactive)
  - Product quantity in request valid? (no stock check here; deferred)
    ↓
[Stage 3: Cart State Validation]
  - Cart exists for user? (create if not)
  - Item already in cart? (update quantity instead of insert)
    ↓
[Stage 4: Add/Update CartItem]
  - Record unit_price at time of add (immutable history)
  - Update quantity if duplicate
  - Return CartItemResponse
```

**Validation Rules:**

| Check | When | Action | Return |
|-------|------|--------|--------|
| Quantity ≤ 0 | Input validation | Reject | 422 Unprocessable Entity |
| Quantity > 999 | Input validation | Reject | 422 Unprocessable Entity |
| Product not found | Business logic | Reject | 404 Not Found |
| Product not available | Business logic | Reject | 409 Conflict - "Product unavailable" |
| Duplicate in cart | Cart state | Update quantity | 200 OK (merged quantities) |

**NOT Validated Here (Deferred to Checkout):**
- Inventory stock levels (cart is "intent", not "reservation")
- Price changes (cart preserves historical price; order validates current price at checkout)
- Shipping availability
- Tax applicability

---

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Cart data loss on account deletion** | Medium | Cascade delete removes carts; user notified via audit log. Accept as acceptable tradeoff. |
| **N+1 queries when fetching cart with items** | High | Use SQLAlchemy `lazy="selectin"` to eager-load items in one query. Test with EXPLAIN ANALYZE. |
| **Stale cart prices at checkout** | Medium | At checkout, re-validate prices against current Product table. Alert user if price changed significantly. |
| **Cart bloat / unused carts accumulating** | Low | Implement background job to soft-delete carts not modified in 90 days (future optimization). |
| **Race condition: concurrent add to same cart** | Medium | Database UNIQUE constraint on (cart_id, product_id) prevents duplicates. PATCH updates are atomic. |
| **Large carts (1000+ items) slow UI** | Low | Implement pagination on frontend CartPage. Lazy-load items. Add warning if cart exceeds 100 items. |
| **Guests cannot save carts** | Low | Acceptable per non-goals. Prompt user to log in before checkout. |

---

## Migration Plan

**Step 1: Database Setup** (Requires deployment)
- Create migration file with Cart and CartItem tables
- Run alembic migration
- Verify indexes created

**Step 2: Backend Deployment** (Backend-only)
- Deploy new Cart and CartItem models
- Deploy routes with all endpoints (GET, POST, PATCH, DELETE, checkout)
- Add to OpenAPI docs
- Endpoints ready but not exposed to frontend yet

**Step 3: Frontend Deployment** (Frontend-only)
- Deploy CartContext and useCart hook
- Deploy CartPage component
- Deploy CartBadge component
- Deploy cart buttons on ProductPage and ProductsPage
- Feature flag (or A/B test) to roll out gradually

**Step 4: Rollout & Validation**
- Monitor error rates and latency on new endpoints
- Validate cart state consistency (spot-check: random users' carts)
- Confirm frontend cart interactions work end-to-end

**Deployment Windows:**
- Database + Backend: Single deploy (migrations + API)
- Frontend: Separate deploy 1-2 hours later (allows backend to stabilize)

---

## Open Questions

1. **Guest User Checkout**: Should guest users be able to checkout without an account, or must they register? (Assumes registration required for now; can revisit in Change 8)

2. **Cart Expiration**: Should empty carts auto-delete after N days of inactivity? Or keep indefinitely? (Suggest: keep indefinitely initially; optimize later if disk space is concern)

3. **Cart Recovery**: If user clears browser cache, can they recover their cart? (Answer: Yes—we fetch from backend on app load, so cache clear has no impact)

4. **Quantity Limits**: Should we cap max quantity per item at 999, or allow higher? (Suggest: 999 for now; most food items won't exceed that)

5. **Price Snapshots**: Should we store historical prices for audit/reporting? Or just unit_price at time of add? (Suggest: unit_price only for now; add audit trail later if needed)

6. **Cart Sharing**: Should users be able to share carts or invite others to collaborate on shopping? (Answer: No—out of scope, deferred to future change)

7. **Multi-currency**: Should cart support different currencies, or always USD? (Answer: USD only for now; multi-currency deferred)

8. **Discounts / Coupons**: Should cart support coupon codes or promotions? (Answer: No—belongs to order placement (Change 8) or later)
