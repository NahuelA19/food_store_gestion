# 🧩 Component Implementation Guide

> How to update Food Store components to use the new design system tokens

---

## Quick Reference

### Color Tokens in Tailwind

All tokens are available as Tailwind classes:

```tsx
// Text colors
<p className="text-text-primary">Primary text</p>
<p className="text-text-secondary">Secondary</p>
<p className="text-text-muted">Muted</p>

// Background colors
<div className="bg-surface">Default surface</div>
<div className="bg-surface-alt">Alt surface</div>
<div className="bg-surface-card">Card surface</div>

// Brand colors
<button className="bg-primary text-text-on-brand">Brand Button</button>
<button className="bg-brand-600">Brand 600</button>
<button className="dark:bg-brand-400">Dark Brand</button>

// Borders
<div className="border border-border">Standard border</div>
<div className="border-2 border-border-active">Active border</div>

// Status colors
<span className="text-pending">Pending</span>
<span className="bg-confirmed-bg text-confirmed">Confirmed</span>
<span className="bg-preparing-bg text-preparing">Preparing</span>

// Shadows
<div className="shadow-card">Card shadow</div>
<div className="hover:shadow-card-hover">Hover shadow</div>
