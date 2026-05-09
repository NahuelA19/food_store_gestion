## ADDED Requirements

### Requirement: Design token system via Tailwind v4 @theme
The system SHALL define all design tokens in `index.css` using Tailwind v4's `@theme` directive, including colors (brand, surface, text, border, status), typography (font families, sizes, weights), spacing (4px base scale), border radius, shadows, and animations.

#### Scenario: Tokens are available as CSS custom properties
- **WHEN** inspecting the compiled CSS
- **THEN** all `@theme` tokens SHALL be available as `--color-*`, `--font-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, and `--animate-*` custom properties

#### Scenario: Tokens are usable as Tailwind utility classes
- **WHEN** using utility classes like `bg-brand` or `text-primary`
- **THEN** Tailwind SHALL resolve them to the corresponding `@theme` token values

### Requirement: Button component with variants
The system SHALL provide a Button component with `variant` (default, destructive, outline, secondary, ghost, link) and `size` (default, sm, lg, icon) props, using CVA (class-variance-authority) for type-safe variant management.

#### Scenario: Default button renders with primary styles
- **WHEN** rendering `<Button>Click</Button>`
- **THEN** it SHALL display with brand background, white text, and rounded corners

#### Scenario: Destructive button renders with error styles
- **WHEN** rendering `<Button variant="destructive">Delete</Button>`
- **THEN** it SHALL display with red/destructive background and white text

#### Scenario: Disabled button is non-interactive
- **WHEN** rendering `<Button disabled>Save</Button>`
- **THEN** it SHALL have `pointer-events: none`, reduced opacity, and no hover effects

### Requirement: Card component with compound sub-components
The system SHALL provide a Card component with Card.Header, Card.Title, Card.Description, Card.Content, and Card.Footer sub-components for consistent content containers.

#### Scenario: Card renders with border and shadow
- **WHEN** rendering `<Card><Card.Content>content</Card.Content></Card>`
- **THEN** it SHALL display with border, rounded corners, background, and subtle shadow

#### Scenario: Card title renders as h3
- **WHEN** rendering `<Card><Card.Title>Title</Card.Title></Card>`
- **THEN** the title SHALL render as an `h3` element with appropriate font size and weight

### Requirement: Input component with error state
The system SHALL provide an Input component with support for labels, error messages, disabled state, and appropriate ARIA attributes.

#### Scenario: Input with error shows error message
- **WHEN** rendering `<Input error="Required" id="email" />`
- **THEN** it SHALL display a red border on the input and an error message below with `role="alert"`

#### Scenario: Disabled input is visually muted
- **WHEN** rendering `<Input disabled />`
- **THEN** it SHALL have reduced opacity, `cursor: not-allowed`, and no focus styles

### Requirement: Badge component with color variants
The system SHALL provide a Badge component with variant prop (success, warning, danger, info, neutral) for status indicators.

#### Scenario: Success badge renders green
- **WHEN** rendering `<Badge variant="success">In Stock</Badge>`
- **THEN** it SHALL display with green background and text

### Requirement: Skeleton component for loading states
The system SHALL provide a Skeleton component with support for different shapes (text, circular, rectangular) and animated shimmer effect.

#### Scenario: Skeleton text shows shimmer animation
- **WHEN** rendering `<Skeleton className="h-4 w-full" />`
- **THEN** it SHALL display a gray placeholder with animated shimmer that respects `prefers-reduced-motion`
