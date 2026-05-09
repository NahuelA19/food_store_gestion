## Context

The Food Store dashboard has a complete layout infrastructure (DashboardLayout, Sidebar, Topbar, Breadcrumbs) with Tailwind v4 design tokens, UI primitives, dark mode, and SVG icons. However, the current pages and sidebar navigation are oriented as a customer-facing e-commerce storefront (Inicio, Productos, Carrito, Mi Perfil), not as a restaurant management admin panel.

**Current state:**
- Layout: ✅ Complete (Sidebar colapsable, Topbar con selector de sucursal, Breadcrumbs)
- UI primitives: ✅ Complete (Button, Card, Input, Badge, Skeleton, Icon)
- Pages: ❌ Customer-oriented (HomePage with static stats, ProductsPage, CartPage, ProfilePage)
- Sidebar: ❌ 3 sections with customer nav items
- Routes: ❌ No dedicated admin management pages

**Constraints:**
- React 18 + TypeScript (strict), Vite, Tailwind v4
- No backend changes — new pages use static/demo data (ready for future API integration)
- All existing pages must remain functional
- Must follow existing patterns (UI primitives, dark mode, responsive)

## Goals / Non-Goals

**Goals:**
- Restructure sidebar from 3 sections to 2 clear management sections
- Add admin management pages: orders, branches, employees
- Redesign HomePage as admin dashboard with real KPIs
- Update existing pages to feel like admin management tools
- Maintain full responsiveness, dark mode, and accessibility

**Non-Goals:**
- Backend API integration (will use static/demo data)
- Authentication/permissions changes
- Removing existing pages (Productos, etc. become admin management pages)
- Real-time updates or WebSocket connections
- Charts libraries (use CSS-only visualizations)
- Customer-facing storefront (this IS the admin panel)

## Decisions

### 1. Sidebar: 2 sections instead of 3

| Current | New |
|---------|-----|
| Principal → Inicio, Productos | **Panel** → Dashboard, Productos, Pedidos |
| Gestión → Carrito, Mi Perfil | **Gestión** → Sucursales, Empleados, Configuración |
| Sistema → Configuración, Ayuda | — |

**Rationale:** The user requested 2 sections. "Ayuda" moves to the Topbar user menu. "Mi Perfil" is already accessible from the Topbar user dropdown. "Carrito" is renamed to "Pedidos" (Orders) as an admin order management function.

### 2. Routes: Flat structure without `/admin` prefix

| Route | Page | Purpose |
|-------|------|---------|
| `/` | HomePage → AdminDashboard | KPIs, metrics, quick actions |
| `/products` | ProductsPage | Product management (existing) |
| `/products/:id` | ProductDetailPage | Product detail (existing) |
| `/orders` | OrdersPage | Order list with filters |
| `/orders/:id` | OrderDetailPage | Order detail + status mgmt |
| `/branches` | BranchesPage | Branch list |
| `/branches/:id` | BranchDetailPage | Branch detail |
| `/employees` | EmployeesPage | Employee list |
| `/login` | LoginPage | Auth (existing) |
| `/register` | RegisterPage | Auth (existing) |

**Rationale:** The app IS an admin dashboard — no need for `/admin` prefix. Existing routes stay but their pages are reframed as admin tools.

### 3. Data layer: Static/demo data matching existing pattern

**Current pattern:** HomePage hardcodes static stats (1250 products, 18 categories, 32 offers, 12 new this week). New pages follow the same pattern.

**Rationale:** Backend APIs for orders, branches, employees don't exist yet. Using static data keeps the change focused on frontend, and the pattern is already established.

### 4. Page structure: Consistent template

Every admin page follows:
```
<PageHeader title="..." description="..." />
<div className="grid ...">
  <!-- Stats / summary cards -->
  <!-- Main content (table, list, or detail) -->
</div>
```

**Rationale:** Consistency across all management pages makes the dashboard feel cohesive.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Static data will need replacement when APIs are built | Design pages with clear data contracts (TypeScript interfaces) that mirror future API shapes |
| Existing tests may reference old nav items | Update test selectors. No logic changes in existing components. |
| Removing "Carrito" from sidebar might confuse users | Cart/order functionality becomes "Pedidos" — clearer admin terminology |
| Sidebar restructure affects all pages at once | Implement in sequence: sidebar → new pages → update existing pages |

## Open Questions

- Should "Ayuda" become a help modal/drawer or a full page? → Decision: Add to Topbar as dropdown item with link to documentation
- Should "Configuración" (Settings) be a full page or modal? → Decision: Route to full page, richer settings UI
