# 🍕 Food Store — Comprehensive Design System

## Overview

A professional, refined design system for the Food Store e-commerce platform, built with modern CSS variables, accessibility standards, and mobile-first responsive design.

---

## Color Palette

### Primary Colors
- **Primary Blue**: `#2e4c8c` — Main brand color, used for buttons, links, headers
- **Primary Dark**: `#1f3456` — Hover state for primary elements
- **Primary Light**: `#3d5fa3` — Secondary shade
- **Primary 50**: `#f0f4f9` — Light background variant

### Accent Colors
- **Accent Cream**: `#fff3e1` — Light, warm accent for CTAs and highlights
- **Accent Dark**: `#ffe0b2` — Darker accent variant
- **Accent Darker**: `#ffd699` — Darkest accent variant

### Status Colors
- **Alert Red**: `#fa2d1a` — Errors, critical states
- **Success Green**: `#10b981` — Success, in-stock states
- **Warning Amber**: `#f59e0b` — Warnings, low stock
- **Info Blue**: `#3b82f6` — Information messages

### Neutral Palette
- **Text Main**: `#0f172a` — Primary text
- **Text Secondary**: `#334155` — Secondary text
- **Text Muted**: `#64748b` — Tertiary text
- **Borders**: `#e2e8f0` — Light borders
- **Background Main**: `#f8fafc` — Page background
- **Background Card**: `#ffffff` — Card background

---

## Typography System

### Font Family
**Primary**: Inter (with system font fallback)
- Excellent readability at all sizes
- Professional, modern appearance
- Comprehensive character support

### Font Sizes
```
Text XS:    0.75rem   (12px)
Text SM:    0.875rem  (14px)
Text Base:  1rem      (16px)
Text LG:    1.125rem  (18px)
Text XL:    1.25rem   (20px)
Text 2XL:   1.5rem    (24px)
Text 3XL:   1.875rem  (30px)
Text 4XL:   2.25rem   (36px)
Text 5XL:   3rem      (48px)
```

### Font Weights
- **Thin**: 100
- **Light**: 300
- **Normal**: 400
- **Semibold**: 600 (common for labels)
- **Bold**: 700 (headers, strong text)
- **Black**: 900 (display text)

### Line Heights
- **Tight**: 1.25 (headers)
- **Normal**: 1.5 (body text)
- **Relaxed**: 1.625 (comfortable reading)
- **Loose**: 2 (spacious text)

---

## Spacing Scale

Consistent spacing based on 0.25rem (4px) units:

```
XS:   0.25rem   (4px)
SM:   0.5rem    (8px)
MD:   1rem      (16px)
LG:   1.5rem    (24px)
XL:   2rem      (32px)
2XL:  3rem      (48px)
3XL:  4rem      (64px)
```

---

## Shadow System

### Elevation Levels
- **Shadow XS**: `0 1px 1px` — Subtle, barely visible
- **Shadow SM**: `0 1px 2px` — Minimal elevation
- **Shadow MD**: `0 4px 6px` — Standard elevation
- **Shadow LG**: `0 10px 15px` — Notable elevation
- **Shadow XL**: `0 20px 25px` — Strong elevation

Used for:
- Cards and panels
- Floating elements
- Dropdown menus
- Modal overlays

---

## Border Radius Scale

```
SM:    4px      (small elements, inputs)
MD:    8px      (buttons, small cards)
LG:    12px     (standard elements, cards)
XL:    16px     (large panels)
2XL:   24px     (extra large sections)
Full:  9999px   (badges, pills)
```

---

## Component Styling

### Buttons
- **Base Height**: 44px (accessible touch target)
- **Variants**:
  - Primary: Gradient blue with shadow
  - Secondary: Light gray outline
  - Outline: Transparent with border
  - Danger: Red for destructive actions
- **States**:
  - Hover: Lift effect (-2px), enhanced shadow
  - Active: Return to normal position
  - Disabled: 60% opacity, not-allowed cursor
  - Focus: 2px outline with 2px offset

### Form Elements
- **Input Height**: 44px minimum
- **Focus States**: Blue border + soft shadow
- **Disabled States**: Light background, muted text
- **Validation**:
  - Error: Red border, alert background
  - Success: Green border, success background

### Cards
- **Padding**: 1.5rem (standard), 2rem (large)
- **Border**: 2px solid light gray
- **Shadow**: MD on normal, LG on hover
- **Hover**: Lift effect, border color change
- **Radius**: LG (12px)

### Badges & Pills
- **Padding**: 0.3rem–0.5rem horizontal, 0.2rem vertical
- **Border Radius**: Full (9999px)
- **Font Size**: XS (0.75rem)
- **Font Weight**: Bold
- **Variants**: Success, Warning, Danger, Neutral

---

## Animations & Transitions

### Timing Functions
- **Fast**: 150ms (150 milliseconds)
- **Base**: 200ms (default interactions)
- **Slow**: 300ms (page transitions)
- **Slowest**: 500ms (major animations)

### Animation Types
- **Fade In**: Opacity + vertical translate
- **Slide In**: Horizontal translate + fade
- **Pulse**: Opacity pulse for loading
- **Shimmer**: Gradient animation for skeleton

---

## Responsive Breakpoints

### Mobile-First Approach
```
Mobile:  up to 480px   (phones)
Tablet:  480px–768px   (small tablets)
Desktop: 768px–1024px  (tablets, small laptops)
Large:   1024px+       (desktops, large screens)
```

### Grid Layouts
- **Products Grid**: 
  - Mobile: 1–2 columns
  - Tablet: 2–3 columns
  - Desktop: 3–4 columns
- **Form Grid**: Single column mobile, multi-column on larger screens

---

## Accessibility Standards

### WCAG 2.1 AA Compliance

#### Color Contrast
- **Primary text**: 4.5:1 minimum (AAA)
- **Secondary text**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **All interactive elements**: Tested against backgrounds

#### Touch Targets
- **Minimum size**: 44×44 pixels
- **Minimum padding**: 8px around clickable areas
- **Spacing**: 8px minimum between interactive elements

#### Focus States
- **Visible focus ring**: 2px solid outline
- **Outline offset**: 2px
- **High contrast**: All focus indicators have ≥3:1 contrast

#### Semantic HTML
- **Form labels**: Associated with `<label htmlFor>`
- **Error messages**: `aria-label` or `aria-describedby`
- **Status messages**: `role="status"` or `role="alert"`
- **Navigation**: Semantic `<nav>`, `<main>`, `<aside>`

#### Keyboard Navigation
- **Tab order**: Logical, from top-left to bottom-right
- **Skip links**: Skip to main content
- **Form submission**: Enter key support
- **Dropdowns**: Arrow key navigation

---

## Component Specifications

### Navigation Bar
- **Height**: 64px (including padding)
- **Logo**: 24px font, 800 weight
- **Links**: Underline animation on hover
- **Active indicator**: Underline bar

### Search Bar
- **Height**: 44px
- **Icon**: 24px emoji/icon
- **Rounded**: 12px border radius
- **Focus shadow**: Blue 4px shadow

### Product Cards
- **Image height**: 160px
- **Hover effect**: Lift (-4px), shadow increase, border color change
- **Responsive**: Adjust image size on mobile
- **Stock badge**: Top-right corner

### Filter Panel
- **Width**: 280px (desktop), full-width (mobile)
- **Sticky**: Top 100px
- **Collapsible**: Toggle on mobile
- **Button alignment**: Flex with gap

### Forms
- **Field spacing**: 24px (1.5rem)
- **Label color**: Primary text, semibold
- **Input padding**: 12px (1rem)
- **Help text**: Muted color, smaller font
- **Error messages**: Red, under field

---

## Aesthetic Direction

### Design Philosophy
**Professional × Refined × Food-Centric**

- **Clean, minimal design** with strategic use of color
- **Warm tones** (cream/beige accents) for food context
- **Strong brand presence** via primary blue
- **Clear hierarchy** through sizing and weight
- **Generous spacing** for breathing room
- **Subtle shadows** for depth without clutter

### Visual Principles
1. **Clarity**: Every element has clear purpose
2. **Consistency**: Cohesive design across all pages
3. **Hierarchy**: Visual weight guides attention
4. **Accessibility**: Inclusive design from start
5. **Performance**: Smooth animations, optimized assets

---

## Updated Files

### CSS Files Modified
- `frontend/src/index.css` — Global variables, utilities, auth pages
- `frontend/src/styles/SearchBar.css` — Search input styling
- `frontend/src/styles/FilterPanel.css` — Filter panel styling
- `frontend/src/styles/ProductsPage.css` — Products page layout
- `frontend/src/styles/SearchResults.css` — Results grid, pagination

### React Components Updated
- `frontend/src/components/Navigation.tsx` — Navigation bar
- `frontend/src/components/ProductCard.tsx` — Product card with new styles
- `frontend/src/components/ProductGrid.tsx` — Product grid layout
- `frontend/src/pages/LoginPage.tsx` — Auth form styling
- `frontend/src/pages/RegisterPage.tsx` — Registration form
- `frontend/src/pages/ProductDetailPage.tsx` — Product detail view
- `frontend/src/pages/ProfilePage.tsx` — User profile page

---

## Key Design Decisions

### Color Choices
**Why #2e4c8c (Primary Blue)?**
- Professional, trustworthy appearance
- Excellent contrast with white backgrounds
- Accessible (WCAG AAA compliant)
- Distinct from orange (outdated primary)

**Why #fff3e1 (Cream Accent)?**
- Warm, inviting tone for food context
- Subtle when used as background
- Complements primary blue
- Creates visual interest without harshness

**Why #fa2d1a (Vibrant Red)?**
- High visibility for alerts and errors
- Food-related connotation (ripe, fresh)
- WCAG AAA contrast with white/black
- Distinct from warning (amber) and success (green)

### Typography Choices
**Why Inter?**
- Modern, geometric sans-serif
- Exceptional readability
- Available in 9 weights
- Optimized for screen rendering

### Spacing & Sizing
**Why 44px minimum touch targets?**
- WCAG 2.5.5 (Target Size) standard
- Comfortable for finger navigation
- Reduces accidental clicks
- Accessible to all users

---

## Testing Checklist

Before deploying, verify:

### Visual
- [ ] Colors match palette specifications
- [ ] Spacing is consistent (multiples of 4px)
- [ ] Typography hierarchy is clear
- [ ] Cards have proper elevation
- [ ] Hover states are smooth and obvious

### Responsive
- [ ] Mobile layout (480px) is readable
- [ ] Tablet layout (768px) looks good
- [ ] Desktop layout (1024px+) uses space well
- [ ] Images scale appropriately
- [ ] No horizontal scrolling on mobile

### Accessibility
- [ ] All interactive elements are 44×44px
- [ ] Focus indicators are visible
- [ ] Color contrast ≥4.5:1 for text
- [ ] Forms have proper labels
- [ ] Error messages are clear
- [ ] Page is navigable with keyboard only

### Performance
- [ ] No layout shift (CLS < 0.1)
- [ ] Animations run smoothly (60fps)
- [ ] No jank on hover/scroll
- [ ] Images are optimized
- [ ] CSS is minified

---

## Future Enhancements

1. **Dark Mode**: Add CSS variables for dark theme
2. **Custom Fonts**: Load Inter via Google Fonts or Typekit
3. **Icon System**: Replace emoji with SVG icons
4. **Animation Library**: Consider Framer Motion for complex animations
5. **Component Library**: Extract reusable components to Storybook

---

## Resources & References

- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **Design System Docs**: Google Material Design, Tailwind CSS
- **Accessibility**: Inclusive Components, WebAIM
- **Typography**: Inter font, CSS Tricks typography guides

---

**Last Updated**: May 8, 2026
**Maintained By**: Food Store Team
**Status**: Production Ready
