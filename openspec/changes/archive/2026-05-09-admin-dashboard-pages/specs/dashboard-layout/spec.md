## MODIFIED Requirements

### Requirement: Responsive top navigation bar
The system SHALL provide a sticky top navigation bar with logo, admin navigation links, and user menu. On mobile (<768px) it SHALL collapse to a hamburger menu with a slide-out drawer. The navigation links SHALL be organized in 2 sidebar sections focused on restaurant management.

#### Scenario: Desktop sidebar shows admin nav links
- **WHEN** viewing on a viewport ≥768px wide
- **THEN** the sidebar SHALL display all management navigation links organized in 2 sections: "Panel" (Dashboard, Productos, Pedidos) and "Gestión" (Sucursales, Empleados, Configuración)

#### Scenario: Mobile nav shows hamburger menu
- **WHEN** viewing on a viewport <768px wide
- **THEN** the navigation SHALL show a hamburger icon that opens a slide-out menu overlay

#### Scenario: Active route is visually indicated
- **WHEN** on the orders page (/orders)
- **THEN** the "Pedidos" nav link SHALL have an active indicator (brand color background/text)

## ADDED Requirements

### Requirement: Sidebar with 2 management sections
The system SHALL provide a sidebar with exactly 2 navigation sections. Section 1 ("Panel") SHALL contain: Dashboard, Productos, Pedidos. Section 2 ("Gestión") SHALL contain: Sucursales, Empleados, Configuración.

#### Scenario: Section 1 shows panel links
- **WHEN** rendering the sidebar
- **THEN** the "Panel" section SHALL display links to Dashboard (icon: LayoutDashboard), Productos (icon: Package), and Pedidos (icon: ShoppingCart)

#### Scenario: Section 2 shows management links
- **WHEN** rendering the sidebar
- **THEN** the "Gestión" section SHALL display links to Sucursales (icon: Building2), Empleados (icon: Users), and Configuración (icon: Settings)

#### Scenario: Collapsed sidebar shows icons only
- **WHEN** the sidebar is collapsed
- **THEN** only icons SHALL be visible, with section titles hidden and tooltips on hover

### Requirement: Existing layout structure preserved
The system SHALL maintain the existing DashboardLayout structure (fixed sidebar, Topbar, Breadcrumbs, responsive behavior, max-width container, mobile bottom nav) while updating navigation content.

#### Scenario: Layout structure unchanged
- **WHEN** rendering any page
- **THEN** the layout SHALL still show Topbar at top, Sidebar on left (or drawer on mobile), Breadcrumbs below Topbar, and content in max-width container
