# Creating a React Component

Step-by-step guide to creating a new React component for the Food Store frontend.

## Example: Build a "Product Card" Component

### Step 1: Create Component File

**File**: `frontend/src/components/ProductCard.tsx`

```tsx
import React from 'react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  onSelect: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  imageUrl,
  onSelect,
}) => {
  return (
    <div className="product-card" onClick={() => onSelect(id)}>
      <img src={imageUrl} alt={name} />
      <h3>{name}</h3>
      <p className="price">${price}</p>
      <button>View Details</button>
    </div>
  );
};
```

### Step 2: Add Styling

**File**: `frontend/src/components/ProductCard.css`

```css
.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.product-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}

.product-card h3 {
  margin: 12px 0 8px;
  font-size: 18px;
}

.product-card .price {
  font-size: 20px;
  font-weight: bold;
  color: #2ecc71;
  margin-bottom: 12px;
}

.product-card button {
  width: 100%;
  padding: 10px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.product-card button:hover {
  background: #2980b9;
}
```

### Step 3: Create Test File

**File**: `frontend/src/components/ProductCard.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const mockProps = {
    id: '1',
    name: 'Deluxe Pizza',
    price: 15.99,
    imageUrl: '/pizza.jpg',
    onSelect: jest.fn(),
  };

  it('renders product information', () => {
    render(<ProductCard {...mockProps} />);
    
    expect(screen.getByText('Deluxe Pizza')).toBeInTheDocument();
    expect(screen.getByText('$15.99')).toBeInTheDocument();
    expect(screen.getByAltText('Deluxe Pizza')).toHaveAttribute('src', '/pizza.jpg');
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    
    render(<ProductCard {...mockProps} onSelect={onSelect} />);
    
    await user.click(screen.getByRole('button', { name: /view details/i }));
    expect(onSelect).toHaveBeenCalledWith('1');
  });

  it('applies hover styles', async () => {
    const { container } = render(<ProductCard {...mockProps} />);
    const card = container.querySelector('.product-card');
    
    expect(card).toBeInTheDocument();
    // CSS hover effects are tested in E2E, not unit tests
  });
});
```

### Step 4: Use Component

**File**: `frontend/src/pages/HomePage.tsx`

```tsx
import { ProductCard } from '@components/ProductCard';

export const HomePage: React.FC = () => {
  const products = [
    { id: '1', name: 'Pizza', price: 15.99, imageUrl: '/pizza.jpg' },
    { id: '2', name: 'Burger', price: 12.99, imageUrl: '/burger.jpg' },
  ];

  const handleProductSelect = (id: string) => {
    console.log(`Selected product: ${id}`);
    // Navigate to product detail page
  };

  return (
    <div className="home">
      <h1>Featured Products</h1>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            onSelect={handleProductSelect}
          />
        ))}
      </div>
    </div>
  );
};
```

### Step 5: Update Component Structure (if needed)

Create an index file to export components easily:

**File**: `frontend/src/components/index.ts`

```typescript
export { ProductCard } from './ProductCard';
export { ProductList } from './ProductList';
export { Button } from './Button';
// ... more components
```

Now you can import:
```tsx
import { ProductCard, Button } from '@components';
```

### Step 6: Format & Lint

```bash
npm run format --workspace frontend
npm run lint --workspace frontend
```

## Component Best Practices

### 1. Props Interface

```tsx
// ✅ Good: Typed props with documentation
interface ButtonProps {
  /** Button text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: 'primary' | 'secondary';
  /** Disable button */
  disabled?: boolean;
}

// ❌ Bad: Implicit props
export const Button = (props) => {
  // ...
};
```

### 2. Functional Components

```tsx
// ✅ Good: Functional component with hooks
export const Counter: React.FC = () => {
  const [count, setCount] = React.useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
};

// ❌ Bad: Class component (outdated)
export class Counter extends React.Component {
  // ...
}
```

### 3. Avoid Prop Drilling

```tsx
// ❌ Bad: Passing props through many levels
<Grandparent user={user}>
  <Parent user={user}>
    <Child user={user} />
  </Parent>
</Grandparent>

// ✅ Good: Use Context API
const UserContext = React.createContext();
<UserContext.Provider value={user}>
  <Grandparent>
    <Parent>
      <Child /> {/* useContext(UserContext) */}
    </Parent>
  </Grandparent>
</UserContext.Provider>
```

### 4. Memoization

```tsx
// ✅ Good: Memoize expensive components
export const ProductList: React.FC<ProductListProps> = React.memo(({ products }) => {
  return <div>{/* render products */}</div>;
});
```

### 5. Custom Hooks

```tsx
// ✅ Good: Extract logic into hooks
const useProductData = () => {
  const [products, setProducts] = React.useState([]);
  
  React.useEffect(() => {
    // Fetch data
  }, []);
  
  return products;
};

export const ProductPage: React.FC = () => {
  const products = useProductData();
  return <div>{/* render */}</div>;
};
```

## File Structure

```
frontend/src/
├── components/
│   ├── ProductCard.tsx        # Component
│   ├── ProductCard.css        # Styles
│   ├── ProductCard.test.tsx   # Tests
│   └── index.ts               # Exports
├── pages/
│   ├── HomePage.tsx
│   └── ProductPage.tsx
├── hooks/
│   ├── useProductData.ts
│   └── useCart.ts
└── services/
    └── apiClient.ts
```

## Checklist

- [ ] Component created with TypeScript
- [ ] Props interface defined
- [ ] Component exported
- [ ] Styles added (CSS or styled-components)
- [ ] Unit tests written
- [ ] Test coverage > 80%
- [ ] Formatted with Prettier
- [ ] Linted with ESLint
- [ ] No TypeScript errors
- [ ] Component story/documentation added
- [ ] Used in parent component

## Common Patterns

### Loading State

```tsx
export const ProductList: React.FC = () => {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchProducts().finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  return <div>{/* render products */}</div>;
};
```

### Error Boundary

```tsx
export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setHasError(true);
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  if (hasError) return <p>Something went wrong</p>;
  return <>{children}</>;
};
```
