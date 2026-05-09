## ADDED Requirements

### Requirement: Dark mode with system preference detection
The system SHALL detect the user's system color scheme preference via `prefers-color-scheme: dark` media query and apply dark mode automatically on first visit. The default SHALL follow the system preference.

#### Scenario: System dark mode applies automatically
- **WHEN** the user's OS has dark mode enabled and the user visits for the first time
- **THEN** the site SHALL render in dark mode without requiring manual toggle

#### Scenario: System light mode applies automatically
- **WHEN** the user's OS has light mode enabled and the user visits for the first time
- **THEN** the site SHALL render in light mode without requiring manual toggle

### Requirement: Manual dark mode toggle
The system SHALL provide a manual dark/light mode toggle button in the navigation bar that overrides the system preference. The user's choice SHALL be persisted in localStorage.

#### Scenario: Toggle switches from light to dark
- **WHEN** clicking the theme toggle in light mode
- **THEN** the site SHALL switch to dark mode immediately and persist the preference

#### Scenario: Persisted preference survives page reload
- **WHEN** the user toggles to dark mode and reloads the page
- **THEN** the site SHALL remain in dark mode

### Requirement: Dark mode token overrides
All design tokens SHALL have dark mode overrides defined in a `.dark` class, covering surfaces, text colors, borders, shadows, and interactive states. All tokens MUST maintain WCAG AA contrast ratios (4.5:1 for normal text).

#### Scenario: Cards have darker surface in dark mode
- **WHEN** in dark mode
- **THEN** card backgrounds SHALL be darker than the page background (e.g., `oklch(22% ...)` vs `oklch(14.5% ...)`)

#### Scenario: Body text remains readable in dark mode
- **WHEN** in dark mode
- **THEN** primary text SHALL have at least 4.5:1 contrast ratio against the dark surface background

### Requirement: ThemeContext provider
The system SHALL provide a ThemeContext React context with `theme` (light/dark) and `toggleTheme` values, wrapping the application in `main.tsx`.

#### Scenario: ThemeContext provides current theme
- **WHEN** any component uses `useTheme()`
- **THEN** it SHALL receive the current theme string and a toggle function

#### Scenario: Theme toggle updates document class
- **WHEN** `toggleTheme` is called
- **THEN** the `dark` class SHALL be toggled on the `document.documentElement`
