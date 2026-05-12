# E2E Testing Guide (Task 12.8)

## Complete E2E Flow Verification

Follow these steps to verify the entire application flow works end-to-end.

### Prerequisites
- Backend running at `http://localhost:8000`
- Frontend running at `http://localhost:5173`
- PostgreSQL running (Docker)
- Clear browser cache/cookies before starting

### Test Flow (10 Steps)

#### Step 1: Register a New User
- Navigate to `http://localhost:5173/register`
- Fill in registration form:
  - **Email**: `test@example.com`
  - **Password**: `ValidPassword123!`
  - **Confirm Password**: `ValidPassword123!`
  - **First Name**: Test
  - **Last Name**: User
- Click **Register** button
- **Expected**: Redirected to login page with success message

#### Step 2: Login with Registered User
- Navigate to `http://localhost:5173/login`
- Fill in login form:
  - **Email**: `test@example.com`
  - **Password**: `ValidPassword123!`
- Click **Login** button
- **Expected**: Redirected to home page, user icon shows in navbar

#### Step 3: Browse Home/Catalog
- Verify products load on home page
- Check if at least 3-5 products are visible
- **Expected Features**:
  - Product cards display with image, name, price
  - Category filters visible
  - Search bar functional
  - Pagination (if applicable)
- Test search: Search for "pizza" or similar
- **Expected**: Results filtered by search term

#### Step 4: Click on Product Detail
- Click on any product card
- Navigate to product detail page
- **Expected Features**:
  - Product image(s) displayed
  - Product name, description visible
  - Price displayed
  - Stock status shown
  - **Add to Cart** button visible and enabled
  - Rating/reviews (if implemented)

#### Step 5: Add to Cart
- On product detail page, click **Add to Cart** button
- **Expected**: 
  - Toast/notification confirming item added
  - Cart icon in navbar shows quantity (e.g., "1")
  - Item successfully added to cart

#### Step 6: Go to Cart & Verify Item
- Click on cart icon in navbar OR navigate to `http://localhost:5173/cart`
- **Expected Features**:
  - Item appears in cart with correct price
  - Quantity can be adjusted (+ / - buttons)
  - Remove item button works
  - Subtotal/Total displayed correctly
  - **Checkout** button visible and enabled

#### Step 7: Proceed to Checkout
- Click **Checkout** button on cart page
- Navigate to checkout page
- **Expected**: Checkout form displays

#### Step 8: Fill Shipping Address & Payment
- On checkout page, fill in shipping address:
  - Address line 1
  - Address line 2 (optional)
  - City
  - State/Province
  - Postal code
  - Country
- Select **Payment Method**:
  - Choose **MercadoPago** (or applicable payment method)
- **Expected**: 
  - Form validates correctly
  - No required field errors
  - Payment method dropdown shows options

#### Step 9: See MercadoPago Init Point / Order Created
- Click **Confirm Order** or **Proceed to Payment** button
- **Expected**:
  - Order is created in backend (check database or API logs)
  - MercadoPago init_point is returned
  - Redirected to payment page OR see checkout button with MP logo
  - Order status = **PENDIENTE** (pending payment)
  - Order ID displayed

#### Step 10: View Order Detail & History
- Go back to app (do NOT complete MP payment, use sandbox mode if available)
- Navigate to **Orders** or **Order History** page
- **Expected Features**:
  - Order appears in order history list
  - Order shows correct status (PENDIENTE or CONFIRMADO)
  - Click on order to view detail page
  - Order detail shows:
    - Order ID
    - Items in order (with price, quantity)
    - Shipping address
    - Order total
    - Order status
    - Created date

---

## Success Criteria

All 10 steps must complete WITHOUT errors:

- ✅ Registration successful
- ✅ Login successful
- ✅ Products load and display correctly
- ✅ Product detail page shows full information
- ✅ Add to cart works
- ✅ Cart displays correct items and total
- ✅ Checkout form displays
- ✅ Shipping address submission works
- ✅ Payment method selection works
- ✅ Order created with correct status
- ✅ Order detail page displays correctly
- ✅ Order history shows order

---

## Error Handling

If you encounter errors:

1. **Backend errors**: Check `backend/` logs for API errors
   - Look for 400/500 responses
   - Verify database connection
   - Check Pydantic validation errors

2. **Frontend errors**: Check browser console (F12 > Console tab)
   - Look for 4xx/5xx errors
   - Check Network tab for failed requests

3. **Database errors**: Verify PostgreSQL is running
   ```bash
   docker-compose ps
   ```

4. **Common issues**:
   - CORS errors: Check backend CORS configuration
   - 401 Unauthorized: Token expired, need to login again
   - 404 Not Found: Route doesn't exist or typo in URL
   - Database connection refused: PostgreSQL not running

---

## API Testing (Optional)

If you want to verify backend APIs directly:

```bash
# Register user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"ValidPassword123!","first_name":"Test","last_name":"User"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"ValidPassword123!"}'

# Get products
curl http://localhost:8000/api/v1/products

# Get product detail
curl http://localhost:8000/api/v1/products/{product_id}
```

---

## Screenshots & Documentation

After completing the E2E flow successfully, proceed to capture screenshots:

1. Take screenshots of each major step
2. Save to `docs/screenshots/` with naming convention: `01-login.png`, `02-register.png`, etc.
3. Create README in `docs/screenshots/README.md`
4. Update root `README.md` with link to screenshots

See `docs/screenshots/README.md` for screenshot list and descriptions.
