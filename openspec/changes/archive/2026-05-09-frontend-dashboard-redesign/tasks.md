## 1. Setup and Dependencies

- [x] 1.1 Install npm packages: tailwindcss, @tailwindcss/vite, lucide-react, clsx, tailwind-merge, class-variance-authority
- [x] 1.2 Configure Vite with `@tailwindcss/vite` plugin in `vite.config.ts`
- [x] 1.3 Create `src/lib/utils.ts` with `cn()` utility using clsx + tailwind-merge
- [x] 1.4 Rewrite `src/index.css` with Tailwind imports + `@theme` token system + dark mode variant
- [x] 1.5 Remove standalone CSS files from `src/styles/` (FilterPanel, ProductsPage, SearchBar, SearchResults)

## 2. UI Component Primitives (`src/components/ui/`)

- [x] 2.1 Create `Button.tsx` with CVA variants (default, destructive, outline, secondary, ghost, link) and sizes (default, sm, lg, icon)
- [x] 2.2 Create `Card.tsx` with compound components (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- [x] 2.3 Create `Input.tsx` with label, error state, disabled state, and ARIA attributes
- [x] 2.4 Create `Badge.tsx` with color variants (success, warning, danger, info, neutral)
- [x] 2.5 Create `Skeleton.tsx` with shape variants (text, circle, rectangle) and shimmer animation
- [x] 2.6 Create Icon wrapper component for consistent lucide-react icon sizing

## 3. Dark Mode

- [x] 3.1 Create `src/context/ThemeContext.tsx` with ThemeProvider, useTheme hook, system preference detection, and localStorage persistence
- [x] 3.2 Wrap `App.tsx` with ThemeProvider in `main.tsx`
- [x] 3.3 Define dark mode CSS token overrides in `.dark` class in `index.css`

## 4. Navigation Redesign

- [x] 4.1 Refactor `Navigation.tsx` — use UI primitives, lucide SVG icons (replacing emojis), responsive hamburger menu for mobile
- [x] 4.2 Add active route indication using React Router's `useLocation`
- [x] 4.3 Add theme toggle button (sun/moon icons) to navigation
- [x] 4.4 Refactor `CartBadge.tsx` to use lucide shopping-cart SVG icon

## 5. HomePage Dashboard

- [x] 5.1 Extract `HomePage` from `App.tsx` into `src/pages/HomePage.tsx` with dashboard layout
- [x] 5.2 Add hero section with headline, subtitle, and CTA button
- [x] 5.3 Add stats cards row (Total Products, Categories, Active Offers, New This Week) with SVG icons and gradient accents
- [x] 5.4 Add featured products section (static/demo data) with ProductCard grid
- [x] 5.5 Add category showcase section with icon + name cards

## 6. Products Page Refinements

- [x] 6.1 Refactor `ProductCard.tsx` — use UI primitives (Card, Badge, Button), replace emojis with SVG icons, improved hover states
- [x] 6.2 Refactor `ProductGrid.tsx` — use Skeleton component, improved empty/error states with SVG icons
- [x] 6.3 Refactor `SearchBar.tsx` — use Input component, lucide search icon
- [x] 6.4 Refactor `SearchInput.tsx` — consistent styling
- [x] 6.5 Refactor `SearchResults.tsx` — use Badge component
- [x] 6.6 Refactor `FilterPanel.tsx` — consistent form controls, lucide icons
- [x] 6.7 Refactor `CategoryFilter.tsx` — consistent styling
- [x] 6.8 Refactor `Pagination.tsx` — use Button component, improved layout
- [x] 6.9 Refactor `ProductsPage.tsx` — consistent layout with page header

## 7. Product Detail Page Redesign

- [x] 7.1 Refactor `ProductDetailPage.tsx` — use Card component, remove inline `<style>` block
- [x] 7.2 Replace emojis with SVG icons (alert, check, loading spinner)
- [x] 7.3 Improve image placeholder area with gradient and icon
- [x] 7.4 Improve quantity selector using Button component
- [x] 7.5 Improve related products section with ProductCard grid
- [x] 7.6 Remove all inline `<style>` tags — use Tailwind utility classes

## 8. Cart Page Redesign

- [x] 8.1 Refactor `CartPage.tsx` — use Card, Button, Badge components, remove inline `<style>` block
- [x] 8.2 Replace emojis with SVG icons (trash-2, shopping-bag, plus, minus, x)
- [x] 8.3 Improve cart item layout with proper grid
- [x] 8.4 Improve summary sidebar with Card component
- [x] 8.5 Replace `window.confirm` with a proper confirmation pattern

## 9. Auth Pages (Login / Register)

- [x] 9.1 Refactor `LoginPage.tsx` — use Input, Button, Card components
- [x] 9.2 Refactor `RegisterPage.tsx` — use Input, Button, Card components
- [x] 9.3 Add lucide SVG icons to form fields and buttons
- [x] 9.4 Remove inline `<style>` blocks — use Tailwind utility classes

## 10. Profile Page Redesign

- [x] 10.1 Refactor `ProfilePage.tsx` — implement tabbed interface (Profile, Preferences, Orders)
- [x] 10.2 Refactor `UserForm.tsx` — use Input, Button components, lucide icons
- [x] 10.3 Refactor `PreferencesPanel.tsx` — use UI primitives, lucide icons
- [x] 10.4 Remove inline `<style>` blocks — use Tailwind utility classes

## 11. Cleanup and Polish

- [x] 11.1 Verify all emoji icons are replaced with SVG equivalents
- [x] 11.2 Remove all inline `<style>` tags from components
- [x] 11.3 TypeScript compilation passes (no errors)
- [x] 11.4 Vite production build succeeds (48KB CSS, 339KB JS)
- [x] 11.5 Run existing tests to verify no regressions (49/49 passing)
