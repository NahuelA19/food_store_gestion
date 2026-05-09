## Why

The Food Store dashboard layout (Sidebar + Topbar + Breadcrumbs) is fully implemented, but the current pages and navigation are oriented as a customer-facing e-commerce storefront. The project needs **admin-focused management pages** — turning the dashboard into a true restaurant management panel with multi-sucursal support. This change creates the admin pages for managing products, orders, branches, and employees, with a sidebar reorganized into two clear management sections.

## What Changes

- **Sidebar restructured** from 3 sections (Principal/Gestión/Sistema) to **2 sections** focused on management
- **Dashboard home page** redesigned with real management metrics (total orders, revenue, active branches, pending tasks)
- **Orders management page** — list of orders with status filters, detail view, and status management
- **Branches management page** — list of sucursales with quick stats per branch
- **Employees management page** — team member list with roles and status
- **Navigation updated** — Sidebar + Topbar reflect the admin management focus
- **Route structure** updated for new admin pages
- All pages use existing UI primitives (Button, Card, Badge, Skeleton, Icon), dark mode, and responsive layout

## Capabilities

### New Capabilities
- `admin-overview`: Dashboard home page with management KPIs, revenue charts (static), pending orders, and quick actions
- `orders-management`: Order list with status filtering, order detail view, status update actions
- `branches-management`: Branch list with per-branch metrics, branch detail page
- `employees-management`: Employee list with roles, status, and basic info

### Modified Capabilities
- `dashboard-layout`: Sidebar restructured to 2 admin-focused sections; navigation items updated for management context

## Impact

- **`frontend/src/App.tsx`**: Add new routes for admin pages
- **`frontend/src/components/layout/Sidebar.tsx`**: Restructure nav sections, replace customer items with management items
- **`frontend/src/pages/`**: New admin pages (AdminDashboard, OrdersPage, OrderDetailPage, BranchesPage, BranchDetailPage, EmployeesPage)
- **`frontend/src/context/`**: Possibly new context or hooks for order/branch/employee data
- **Backend, API layer, hooks, types**: Unchanged for now — new pages use static/demo data, ready for future API integration
