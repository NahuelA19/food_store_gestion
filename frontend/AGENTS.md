# Frontend — Agent Instructions

> Scoped instructions for any agent working inside the `frontend/` directory.
> These complement (and never replace) the root `AGENTS.md`.

---

## What this is

React 18 + TypeScript frontend for the Food Store e-commerce platform.

- **Entrypoint**: `src/main.tsx`
- **Root component**: `src/App.tsx`
- **Components**: `src/components/` — presentational, reusable
- **Pages**: `src/pages/` — route-level, own state and API calls
- **Hooks**: `src/hooks/` — custom hooks, all stateful logic lives here
- **Tests**: `src/__tests__/`

---

## MANDATORY: Load this skill before writing any component, hook, or page

→ Load `.agents/skills/react/SKILL.md`

**Important**: This project uses vanilla React (not `@json-render/react`).
When reading the skill, apply the **component architecture patterns** — functional components,
props, hooks, event handling. Skip the JSON spec/catalog/`Renderer` sections.

---

## Architecture rules

### Separation of concerns (Container / Presentational)

| Location | Responsibility | Can call API? | Has state? |
|----------|----------------|---------------|------------|
| `src/pages/` | Container — owns data flow | ✅ via hooks | ✅ |
| `src/components/` | Presentational — renders props | ❌ | ❌ (local UI state only) |
| `src/hooks/` | Custom hooks — stateful logic | ✅ | ✅ |

**Rule**: If a component needs to fetch data → extract that logic to a hook in `src/hooks/`.

### TypeScript

- Strict mode is ON. Never use `any`.
- Define prop types as `interface` (preferred) or `type` — never inline without a name.
- All API response shapes must be typed.

### State management

- Use React built-ins: `useState`, `useReducer`, `useContext`.
- No Redux, no Zustand (unless explicitly added).
- Complex state → custom hook in `src/hooks/`.

---

## Component template

```tsx
// src/components/ProductCard/ProductCard.tsx
interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  onSelect: (id: number) => void;
}

export function ProductCard({ id, name, price, onSelect }: ProductCardProps) {
  return (
    <div onClick={() => onSelect(id)}>
      <h3>{name}</h3>
      <span>{price}</span>
    </div>
  );
}
```

## Custom hook template

```tsx
// src/hooks/useProducts.ts
import { useState, useEffect } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}
```

---

## Running locally

```bash
npm run dev --workspace frontend
# → http://localhost:5173
```

## Running tests

```bash
npm run test --workspace frontend          # watch mode
npm run test:ui --workspace frontend       # browser UI
```

## Code quality

```bash
npm run lint --workspace frontend          # ESLint
npm run format --workspace frontend        # Prettier
npm run type-check --workspace frontend    # tsc --noEmit
```

---

## Environment variables

File: `frontend/.env.local` (create from `.env.example`)

```
VITE_API_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000
VITE_ENV=development
VITE_DEBUG=true
```

Access in code: `import.meta.env.VITE_API_URL` — never `process.env`.
