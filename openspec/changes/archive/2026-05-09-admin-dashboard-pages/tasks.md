## 1. Sidebar Restructure

- [x] 1.1 Restructure `Sidebar.tsx` nav sections from 3 to 2: "Panel" (Dashboard, Productos, Pedidos) and "Gestión" (Sucursales, Empleados, Configuración)
- [x] 1.2 Add new navigation items with corresponding lucide icons: ShoppingCart for Pedidos, Building2 for Sucursales, Users for Empleados
- [x] 1.3 Remove "Sistema" section and move Ayuda to Topbar user menu dropdown
- [x] 1.4 Update active route detection to cover new admin routes

## 2. Admin Dashboard (HomePage)

- [x] 2.1 Redesign `HomePage.tsx` with admin KPI cards: total orders (today/week/month), revenue, active branches, pending orders, products count — each with SVG icon, numeric value, trend indicator
- [x] 2.2 Add quick actions section with buttons: "Nuevo Producto", "Ver Pedidos", "Gestionar Sucursales"
- [x] 2.3 Add pending orders summary table (compact) on dashboard with order ID, customer, status badge, total
- [x] 2.4 Add branch overview cards on dashboard with name, address, status badge, order count per branch
- [x] 2.5 Add Skeleton loading states for all dashboard sections

## 3. Orders Management

- [x] 3.1 Create `OrdersPage.tsx` with orders table: ID, customer, status badge, total, date, branch — with static demo data
- [x] 3.2 Add status filter bar (pending, confirmed, preparing, ready, delivered, cancelled) using Badge components
- [x] 3.3 Add loading skeleton state and empty state with lucide icon
- [x] 3.4 Create `OrderDetailPage.tsx` with full order info: header (ID, status, date), customer section, items table, order summary
- [x] 3.5 Add status management dropdown on order detail page with update action
- [x] 3.6 Add route for `/orders` and `/orders/:id` in `App.tsx`

## 4. Branches Management

- [x] 4.1 Create `BranchesPage.tsx` with branch cards grid: name, address, status badge, today's orders, revenue — with static demo data
- [x] 4.2 Add hover actions on branch cards: "Ver Detalle" and "Toggle Status" buttons
- [x] 4.3 Add loading skeleton grid state
- [x] 4.4 Create `BranchDetailPage.tsx` with branch header, contact section, stats row, staff count, recent orders
- [x] 4.5 Add route for `/branches` and `/branches/:id` in `App.tsx`

## 5. Employees Management

- [x] 5.1 Create `EmployeesPage.tsx` with employees table: avatar (initials), name, email, role badge, branch, status badge, join date — with static demo data
- [x] 5.2 Add role filter (Manager, Chef, Waiter, etc.) using Badge components
- [x] 5.3 Add loading skeleton state
- [x] 5.4 Add route for `/employees` in `App.tsx`

## 6. Navigation Polish

- [x] 6.1 Update Topbar user menu: add "Ayuda" link, remove duplicate profile link if present
- [x] 6.2 Ensure all new pages use Breadcrumbs correctly (auto-generated from routes)
- [x] 6.3 Verify all pages respect dark mode and are responsive
- [x] 6.4 Verify mobile bottom nav reflects admin nav items
- [x] 6.5 TypeScript compilation passes with no errors
- [x] 6.6 Existing tests continue to pass
