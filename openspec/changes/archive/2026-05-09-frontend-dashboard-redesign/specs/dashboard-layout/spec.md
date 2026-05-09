## ADDED Requirements

### Requirement: Responsive top navigation bar
The system SHALL provide a sticky top navigation bar with logo, navigation links, cart badge, and user menu. On mobile (<768px) it SHALL collapse to a hamburger menu with a slide-out drawer.

#### Scenario: Desktop nav shows all links horizontally
- **WHEN** viewing on a viewport ≥768px wide
- **THEN** the navigation SHALL display all links (Products, Cart, Profile) in a horizontal row with the logo on the left

#### Scenario: Mobile nav shows hamburger menu
- **WHEN** viewing on a viewport <768px wide
- **THEN** the navigation SHALL show a hamburger icon that opens a slide-out menu overlay

#### Scenario: Active route is visually indicated
- **WHEN** on the products page (`/products`)
- **THEN** the "Products" nav link SHALL have an active indicator (different color or underline)

### Requirement: Page layout with consistent structure
Every page SHALL follow a consistent layout structure: `<main>` with max-width container, appropriate padding, and responsive gutters.

#### Scenario: Pages have consistent max-width
- **WHEN** viewing any page on desktop
- **THEN** the content SHALL be constrained to a max-width container (1280px) centered horizontally

#### Scenario: Mobile has appropriate padding
- **WHEN** viewing any page on a mobile viewport
- **THEN** content SHALL have at least 16px horizontal padding from viewport edges

### Requirement: Dashboard-style HomePage
The HomePage SHALL display a hero section with headline and CTA, stats cards row (total products, categories, offers), featured products grid, and category showcase.

#### Scenario: HomePage shows stats cards
- **WHEN** rendering the HomePage
- **THEN** it SHALL display a row of stat cards showing key metrics with icons and values

#### Scenario: HomePage shows featured products
- **WHEN** rendering the HomePage
- **THEN** it SHALL display a grid of featured product cards with image, name, and price

### Requirement: Tabbed ProfilePage
The ProfilePage SHALL use a tabbed interface with tabs for Profile Information, Preferences, and Order History.

#### Scenario: Tabs switch content
- **WHEN** clicking the "Preferences" tab
- **THEN** the content SHALL switch to show preferences form without page reload

#### Scenario: Active tab is highlighted
- **WHEN** a tab is selected
- **THEN** it SHALL have a visual active state (colored border or background)
