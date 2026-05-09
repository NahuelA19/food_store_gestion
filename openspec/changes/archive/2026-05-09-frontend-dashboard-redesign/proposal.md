## Why

The Food Store frontend has a functional but visually amateur interface. It uses emojis as icons, scattered CSS (inline `<style>` tags per component, plain CSS files, and global styles), no design system, and a generic layout. To build user trust and compete with modern e-commerce experiences, the frontend needs a **professional dashboard-quality redesign** — consistent, polished, and delightful.

This change transforms the entire frontend surface: design tokens, component library, layout, icons, dark mode, and every page.

## What Changes

- **Tailwind CSS v4** replaces plain CSS as the styling foundation (CSS-first, `@theme` tokens, JIT)
- **Design token system** with `@theme` in CSS: colors, typography, spacing, shadows, breakpoints
- **UI component library** under `src/components/ui/` (Button, Card, Input, Badge, Modal, Skeleton, Toast, etc.)
- **SVG icon system** with `lucide-react` — replaces all emoji icons (🍕🥕⚠️→professional SVG)
- **Dark mode** with system preference detection + manual toggle, persisted in localStorage
- **Navigation redesign** — sticky top navbar with dropdowns, mobile hamburger menu, active indicators
- **Home page** → Dashboard-style with stats cards, featured products grid, category showcase
- **Products page** — refined grid, better filters sidebar, professional product cards
- **Product detail page** — improved layout with image gallery, specifications, quantity selector
- **Cart page** — elegant split layout with item list + sticky summary sidebar
- **Profile page** — tabbed interface (profile info, preferences, order history placeholder)
- **Animation system** — CSS-only micro-interactions, staggered entrance animations, skeleton loaders
- **Accessibility audit** — proper focus-visible, aria labels, semantic HTML, keyboard navigation
- **Responsive refinement** — mobile-first polish across all breakpoints
- All existing functionality preserved — no regressions

## Capabilities

### New Capabilities
- `ui-design-system`: Design tokens, Tailwind v4 configuration, component primitives (Button, Card, Input, Badge, Modal, Skeleton, Toast, Navigation, Grid)
- `dashboard-layout`: Global layout structure with responsive navigation, sidebar/footer, page templates
- `svg-icons`: SVG icon system using lucide-react, replacing all emoji-based icons across the frontend
- `dark-mode`: Dark mode with `prefers-color-scheme` detection, manual toggle, localStorage persistence, and themed components

### Modified Capabilities
- *(none — no existing spec requirements are changing; this is a pure UI redesign)*

## Impact

- **`frontend/package.json`**: Add `tailwindcss`, `@tailwindcss/vite`, `lucide-react`
- **`frontend/vite.config.ts`**: Add Tailwind plugin
- **`frontend/src/index.css`**: Complete rewrite — Tailwind base + `@theme` tokens
- **`frontend/src/main.tsx`**: Add ThemeProvider wrapper
- **`frontend/src/App.tsx`**: Updated layout, routing structure
- **`frontend/src/components/`**: New `ui/` subdirectory with primitives; refactored existing components
- **`frontend/src/pages/`**: All pages redesigned (Home, Products, ProductDetail, Cart, Login, Register, Profile)
- **`frontend/src/context/`**: New ThemeContext
- **`frontend/src/styles/`**: Remove standalone CSS files (replaced by Tailwind utility classes)
- **API layer, hooks, types**: Unchanged — UI only
