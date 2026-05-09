## ADDED Requirements

### Requirement: All emoji icons replaced with SVG icons
The system SHALL replace ALL emoji-based icons across every component and page with equivalent SVG icons from the `lucide-react` library. This includes navigation, product cards, buttons, status indicators, empty states, and form elements.

#### Scenario: Navigation uses SVG icons
- **WHEN** rendering the navigation bar
- **THEN** the cart icon SHALL be a shopping cart SVG (not 🛒), the user icon SHALL be an SVG (not 👤), and all navigation icons SHALL be SVG-based

#### Scenario: Product cards use SVG for visual elements
- **WHEN** rendering a product card
- **THEN** stock status badges SHALL use SVG icons (check-circle, alert-triangle) not emojis

#### Scenario: Buttons with icons use SVGs
- **WHEN** rendering any button with an icon (e.g., "Add to Cart")
- **THEN** the icon SHALL be an SVG, not an emoji

### Requirement: Icon wrapper component for consistency
The system SHALL provide an Icon wrapper component that accepts a lucide icon component and optional size/className props, ensuring consistent sizing (default 20px) and styling.

#### Scenario: Icon renders at correct size
- **WHEN** rendering `<Icon icon={ShoppingCart} size={24} />`
- **THEN** it SHALL render a 24x24px SVG

#### Scenario: Icon accepts className for styling
- **WHEN** rendering `<Icon icon={User} className="text-brand" />`
- **THEN** it SHALL apply the `text-brand` class to color the SVG via currentColor

### Requirement: Empty states use SVG illustrations
The system SHALL replace emoji-based empty states (cart empty, no products, no results) with SVG icons from lucide-react.

#### Scenario: Empty cart shows SVG icon
- **WHEN** the cart is empty
- **THEN** the empty state SHALL display a shopping-bag or similar SVG icon (not 🛒)
