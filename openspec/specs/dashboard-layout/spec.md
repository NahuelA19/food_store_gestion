## Purpose

Define the layout structure for the Food Store admin dashboard, including sidebar navigation, topbar, breadcrumbs, responsive behavior, and consistent page layout containers.

## Requirements

### Requirement: Responsive top navigation bar with admin navigation
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

### Requirement: Page layout with consistent structure
Every page SHALL follow a consistent layout structure: `<main>` with max-width container, appropriate padding, and responsive gutters.

#### Scenario: Pages have consistent max-width
- **WHEN** viewing any page on desktop
- **THEN** the content SHALL be constrained to a max-width container (1280px) centered horizontally

#### Scenario: Mobile has appropriate padding
- **WHEN** viewing any page on a mobile viewport
- **THEN** content SHALL have at least 16px horizontal padding from viewport edges

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

## MODIFIED Requirements

### Requirement: Sidebar hidden for COCINA role
The system SHALL hide the sidebar when a user with role `cocina` is viewing any page. This gives the KDS maximum screen real estate on kitchen tablets.

#### Scenario: Sidebar not rendered for cocina
- **WHEN** a user with role `cocina` is authenticated
- **THEN** the sidebar SHALL NOT be rendered in the DashboardLayout

#### Scenario: Sidebar still visible for admin
- **WHEN** a user with role `admin` is authenticated
- **THEN** the sidebar SHALL still be rendered as normal

### Requirement: Topbar shows KDS link
The Topbar navigation SHALL include a link to `/cocina` for users with role `cocina`, `pedidos`, or `admin`.

#### Scenario: Topbar has Cocina link for cocina role
- **WHEN** a user with role `cocina` views the Topbar
- **THEN** the Topbar SHALL display a navigation link labeled "Cocina" pointing to `/cocina`

#### Scenario: Topbar has Cocina link for admin
- **WHEN** a user with role `admin` views the Topbar
- **THEN** the Topbar SHALL display a navigation link labeled "Cocina" pointing to `/cocina`

### Requirement: Sidebar has KDS link for admin
The sidebar SHALL include a "Cocina" link under the "Panel" section, visible only to users with role `admin`.

#### Scenario: Admin sees Cocina link in sidebar
- **WHEN** a user with role `admin` views the sidebar
- **THEN** the "Panel" section SHALL include a "Cocina" link with icon ChefHat pointing to `/cocina`

### Requirement: ChefPage redirects to /cocina
The ChefPage component SHALL redirect to `/cocina` on mount, maintaining backward compatibility for bookmarks.

#### Scenario: Navigating to /chef redirects
- **WHEN** a user navigates to `/chef`
- **THEN** the system SHALL redirect to `/cocina` using `replace: true` (no back-navigation to /chef)
