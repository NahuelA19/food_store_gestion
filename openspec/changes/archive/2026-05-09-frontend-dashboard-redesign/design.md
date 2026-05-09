## Context

The Food Store frontend (React 18 + TypeScript + Vite) currently uses plain CSS with CSS custom properties for theming. The styling is fragmented across:

- `frontend/src/index.css` — global styles (design tokens, buttons, forms, cards, utilities)
- `frontend/src/styles/*.css` — per-component CSS files (FilterPanel, ProductsPage, SearchBar, SearchResults)
- Inline `<style>` blocks inside React components (ProductCard, ProductDetailPage, CartPage, ProfilePage, ProductGrid)
- Emojis used as icons throughout (🍕🥕⚠️)

This fragmentation makes the UI inconsistent, hard to maintain, and visually amateur. There is no design system, no component library, no dark mode, and no cohesive animation language.

**Technical constraints:**
- React 18 + TypeScript (strict mode), Vite bundler
- No CSS framework currently installed
- Existing components, hooks, context, and API layer must remain functional
- All existing tests must continue to pass
- Must be responsive (mobile-first)

## Goals / Non-Goals

**Goals:**
- Establish a professional design system with Tailwind CSS v4 (`@theme` tokens)
- Create a reusable UI component library under `src/components/ui/`
- Replace all emoji-based icons with SVG icons (lucide-react)
- Implement dark mode with system preference detection + manual toggle
- Redesign all pages with consistent, polished layouts
- Add cohesive animations and micro-interactions
- Meet WCAG AA accessibility standards
- Full responsiveness across all breakpoints

**Non-Goals:**
- Changing API layer, hooks, or data fetching logic
- Adding new backend functionality
- Changing authentication or cart logic
- Rewriting tests (existing tests should pass with updated imports)
- Adding actual dashboard analytics (stats are decorative/static for now)
- E2E testing or visual regression testing

## Decisions

### 1. Tailwind CSS v4 (CSS-first configuration) instead of Tailwind v3 or plain CSS

| Option | Verdict |
|--------|---------|
| **Tailwind v4** ✅ | CSS-first `@theme` tokens align with modern CSS best practices. No `tailwind.config.ts` needed. JIT by default. |
| Tailwind v3 | Requires JS config file. More boilerplate. Legacy approach. |
| Plain CSS | Maintained current fragmentation. No design system enforcement. |

**Rationale:** Tailwind v4's `@theme` directive lets us define design tokens as native CSS custom properties, which is cleaner and more portable. The `@tailwindcss/vite` plugin integrates directly with Vite.

### 2. lucide-react for SVG icons instead of react-icons or custom SVGs

| Option | Verdict |
|--------|---------|
| **lucide-react** ✅ | Tree-shakeable, consistent 24px stroke design, TypeScript support, good icon coverage for e-commerce (shopping-cart, user, search, etc.) |
| react-icons | Bundles multiple icon sets (larger bundle). Inconsistent stroke styles. |
| Custom SVGs | Maintainable but time-intensive. No design consistency guarantee. |

**Rationale:** Lucide provides a single, consistent stroke-based icon language that works perfectly for e-commerce. Tree-shaking ensures only used icons are bundled.

### 3. CSS-only animations instead of Framer Motion or Motion library

| Option | Verdict |
|--------|---------|
| **CSS-only** ✅ | Zero runtime cost. Sufficient for our needs (entrance animations, hover effects, transitions). Respects `prefers-reduced-motion`. |
| Framer Motion | Overkill for this project. Adds ~30KB to bundle. Better for complex orchestrated animations. |
| CSS + Tailwind | Tailwind v4 natively supports `@keyframes` in `@theme` — perfect for our needs. |

**Rationale:** Our animation needs are CSS-complexity level: staggered entrances, micro-interactions, skeleton loaders. No drag, no layout animations, no gesture-driven motion needed.

### 4. ThemeContext + CSS class toggle instead of CSS-only `prefers-color-scheme`

| Option | Verdict |
|--------|---------|
| **ThemeContext + class toggle** ✅ | Supports system preference detection + manual override. Persisted in localStorage. Works with Tailwind's `@custom-variant dark`. |
| CSS-only `prefers-color-scheme` | No manual toggle possible. Cannot persist user preference. |

**Rationale:** Dark mode must respect both system preference AND user override. A React context with localStorage persistence is the standard pattern.

### 5. Granular component primitives (CVA pattern) instead of monolithic components

| Option | Verdict |
|--------|---------|
| **CVA + cn() utility** ✅ | `class-variance-authority` provides type-safe variants. `clsx` + `tailwind-merge` handles class merging. |
| Single monolithic components | Harder to maintain, no variant system, duplicated code. |

**Rationale:** CVA with `cn()` is the industry standard for Tailwind component libraries (shadcn/ui, Radix patterns). It gives us type-safe variant props (size, variant, state).

### 6. New `src/components/ui/` directory instead of modifying existing components in-place

| Option | Verdict |
|--------|---------|
| **New `ui/` directory** ✅ | Clean separation. Existing components import from `ui/`. No risk of breaking existing code mid-refactor. |
| In-place refactor | Risk of breaking changes. Harder to test incrementally. |

**Rationale:** Building the UI library in parallel with existing components, then updating the existing components to use the new primitives, is safer and more incremental.

## Architecture

```
src/
├── components/
│   ├── ui/                    ← NEW: Component primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── Icon.tsx           ← Lucide icon wrapper
│   ├── Navigation.tsx         ← REFACTORED: uses UI primitives
│   ├── ProductCard.tsx        ← REFACTORED: uses UI primitives, SVG icons
│   ├── ProductGrid.tsx        ← REFACTORED: uses UI primitives
│   ├── SearchBar.tsx          ← REFACTORED: uses UI primitives
│   ├── SearchInput.tsx        ← REFACTORED
│   ├── SearchResults.tsx      ← REFACTORED
│   ├── FilterPanel.tsx        ← REFACTORED
│   ├── CategoryFilter.tsx     ← REFACTORED
│   ├── Pagination.tsx         ← REFACTORED
│   ├── PreferencesPanel.tsx   ← REFACTORED
│   ├── UserForm.tsx           ← REFACTORED
│   ├── ProtectedRoute.tsx     ← UNCHANGED
│   └── Cart/
│       └── CartBadge.tsx      ← REFACTORED: SVG icon
├── pages/
│   ├── HomePage.tsx           ← REDESIGNED: dashboard layout
│   ├── ProductsPage.tsx       ← REDESIGNED
│   ├── ProductDetailPage.tsx  ← REDESIGNED
│   ├── CartPage.tsx           ← REDESIGNED
│   ├── LoginPage.tsx          ← REDESIGNED
│   ├── RegisterPage.tsx       ← REDESIGNED
│   └── ProfilePage.tsx        ← REDESIGNED: tabbed layout
├── context/
│   ├── AuthContext.tsx         ← UNCHANGED
│   ├── CartContext.tsx         ← UNCHANGED
│   └── ThemeContext.tsx        ← NEW: dark mode
├── hooks/                     ← UNCHANGED
├── styles/                    ← REMOVED: replaced by Tailwind
└── index.css                  ← REWRITTEN: Tailwind imports + @theme
```

## Theme Token Architecture

```css
/* Design tokens defined in @theme */
@theme {
  /* Colors — semantic naming */
  --color-brand-50: oklch(...);
  --color-brand-100: oklch(...);
  /* ... */
  --color-surface: oklch(...);
  --color-surface-alt: oklch(...);
  --color-border: oklch(...);
  --color-text-primary: oklch(...);
  --color-text-secondary: oklch(...);

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: '...';   /* distinctive brand font */

  /* Spacing — 4px base */
  --spacing: 0.25rem;

  /* Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* Shadows */
  --shadow-card: ...;
  --shadow-dropdown: ...;
  --shadow-modal: ...;

  /* Animations */
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-slide-up: slide-up 0.3s ease-out;
  /* keyframes in @theme */
}

/* Dark mode overrides via class */
.dark {
  --color-surface: oklch(...);
  --color-text-primary: oklch(...);
  /* etc. */
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Tailwind v4 is relatively new (2024) and may have edge cases | Stick to core features (@theme, @import, utilities). Avoid experimental APIs. |
| Adding Tailwind increases CSS bundle size | Tailwind v4 has better tree-shaking than v3. Use `@import "tailwindcss"` which only includes used utilities. |
| Refactoring existing CSS to Tailwind is time-intensive | Focus on visual output, not 1:1 migration. Use inline `<style>` removal as quality gate. |
| Existing tests may break if component structure changes | Update test imports and selectors. No logic changes means tests adapt easily. |
| Dark mode may cause contrast issues | Test all pages in both modes. Follow WCAG 4.5:1 minimum contrast. |
| Users may not like drastic visual changes | This is an MVP-stage project. Visual refresh now avoids debt later. |

## Migration Plan

1. Install dependencies: `tailwindcss`, `@tailwindcss/vite`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`
2. Configure Vite with `@tailwindcss/vite` plugin
3. Rewrite `index.css` with Tailwind imports + `@theme` tokens + dark mode variants
4. Build UI primitives in `src/components/ui/` (Button, Card, Input, Badge, Skeleton, Icon wrapper)
5. Create ThemeContext for dark mode
6. Refactor Navigation.tsx to use UI primitives + SVG icons + mobile menu
7. Extract HomePage from App.tsx into its own component file with dashboard design
8. Refactor remaining components (ProductCard, ProductGrid, SearchBar, FilterPanel, Pagination, etc.)
9. Redesign all pages (Products, Detail, Cart, Login, Register, Profile)
10. Remove standalone CSS files and inline `<style>` blocks
11. Update tests if needed for new class names/selectors
12. Final visual QA in light + dark mode, mobile + desktop

## Open Questions

- Should we use a specific display font (e.g., Cabinet Grotesk, Satoshi) or stick with Inter for now?
- The `ui-ux-pro-max` skill's design system generator can produce a full theme — should we run it?
- Confirm: should we keep the current color palette (blue primary, cream accent) or choose a new direction?
