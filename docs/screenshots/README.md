# Food Store Screenshots

Complete visual walkthrough of the Food Store e-commerce platform user interface and admin dashboard.

## Screenshot Gallery

| # | Screenshot | Description | Page |
|---|-----------|-------------|------|
| 1 | `01-login.png` | User authentication form with email and password fields | Login |
| 2 | `02-register.png` | New user registration form with all required fields | Register |
| 3 | `03-catalog.png` | Home/Catalog page showing product listings, filters, and search | Home/Catalog |
| 4 | `04-product-detail.png` | Product detail page with image, description, price, and add to cart button | Product Detail |
| 5 | `05-cart.png` | Shopping cart page with items, quantities, totals, and checkout button | Cart |
| 6 | `06-checkout.png` | Checkout page with shipping address form and payment method selection | Checkout |
| 7 | `07-order-detail.png` | Order detail page showing order info, items, shipping address, and status | Order Detail |
| 8 | `08-orders-history.png` | Orders history page listing all user orders with status and dates | Orders History |
| 9 | `09-admin-dashboard.png` | Admin dashboard overview with metrics and controls | Admin Dashboard |
| 10 | `10-admin-orders.png` | Admin orders management page showing all orders (or user profile if no admin) | Admin Orders / Profile |

---

## Screenshot Descriptions

### 1. Login Page (`01-login.png`)
- Email input field
- Password input field  
- "Remember me" checkbox
- Login button
- Link to registration page
- Clean, professional design

### 2. Register Page (`02-register.png`)
- Email input field
- Password input field
- Confirm password field
- First name field
- Last name field
- Terms & conditions checkbox
- Register button
- Link to login page

### 3. Catalog Page (`03-catalog.png`)
- Product grid/list view
- Product cards showing: image, name, price, rating
- Category filters on left sidebar
- Search bar at top
- Sort options (price, popularity, newest)
- Pagination controls
- "Add to cart" buttons on each product

### 4. Product Detail Page (`04-product-detail.png`)
- Large product image (with zoom capability if available)
- Product name and rating
- Price (regular and discounted if applicable)
- Stock status
- Product description
- Size/variant selector (if applicable)
- Quantity selector (+ / - buttons)
- Add to cart button
- Related products section (optional)

### 5. Cart Page (`05-cart.png`)
- Cart items table with:
  - Product image/name
  - Unit price
  - Quantity (adjustable)
  - Subtotal per item
  - Remove button
- Subtotal
- Shipping cost (if calculated)
- Taxes (if applicable)
- **Total** amount
- Continue shopping button
- Checkout button
- Apply coupon field (optional)

### 6. Checkout Page (`06-checkout.png`)
- Shipping address form with fields:
  - Address line 1
  - Address line 2
  - City
  - State/Province
  - Postal code
  - Country
- Payment method selection:
  - MercadoPago
  - Credit card
  - Other methods
- Order summary (items, total)
- Confirm order button
- Back to cart button

### 7. Order Detail Page (`07-order-detail.png`)
- Order header with:
  - Order ID
  - Order date
  - Order status (PENDIENTE, CONFIRMADO, ENVIADO, ENTREGADO, CANCELADO)
- Items in order:
  - Product name
  - Quantity
  - Unit price
  - Subtotal
- Shipping address
- Order total
- Payment method used
- Tracking number (if shipped)
- Cancel order button (if available)

### 8. Orders History Page (`08-orders-history.png`)
- List/table of user's orders
- Each order row shows:
  - Order ID (clickable)
  - Order date
  - Number of items
  - Total amount
  - Status badge (color-coded)
  - View details button
- Filter by status (optional)
- Search by order ID (optional)
- Pagination

### 9. Admin Dashboard (`09-admin-dashboard.png`)
- Dashboard overview with metrics:
  - Total sales
  - Total orders
  - Total customers
  - Revenue
  - Charts (sales trends, top products, etc.)
- Quick actions
- Recent orders list
- Admin navigation menu

### 10. Admin Orders Page (`10-admin-orders.png`)
- Table of all orders (across all users)
- Columns:
  - Order ID
  - Customer name
  - Order date
  - Total amount
  - Status
  - Actions (view, edit, cancel)
- Filters by:
  - Status
  - Date range
  - Customer
- Search functionality
- Bulk actions (optional)

---

## Using These Screenshots

1. **For documentation**: Reference these screenshots when creating user guides or tutorials
2. **For onboarding**: Show new team members the complete user interface
3. **For marketing**: Use in landing page or promotional materials
4. **For testing**: Compare with actual implementation to verify UI consistency
5. **For presentations**: Include in stakeholder presentations or demos

---

## Screenshot Quality Guidelines

- Minimum resolution: 1280 x 720 (HD)
- Recommended resolution: 1920 x 1080 (Full HD)
- Format: PNG (lossless)
- Clean, no sensitive data visible
- Well-lit, readable text
- No overlapping windows or distractions
- Consistent browser/device presentation
- Include user data/examples where relevant (fake data OK)

---

## Updating Screenshots

When the UI changes:

1. Update the affected screenshot(s)
2. Update description if UI changed significantly
3. Commit with message: `docs(screenshots): update {page_name} screenshot`
4. Update this README if new pages are added

---

## Related Documentation

- [E2E Testing Guide](../E2E-TESTING-GUIDE.md) - Step-by-step flow to generate these screenshots
- [Architecture](../ARCHITECTURE.md) - Technical architecture overview
- [API Documentation](../API.md) - Backend API reference
- [User Stories](../Historias_de_usuario.txt) - Feature requirements
