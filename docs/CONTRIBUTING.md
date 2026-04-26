# Contributing to Food Store

Welcome! We're excited you want to contribute. This guide will help you get started.

## Code of Conduct

- Be respectful and constructive
- Welcome diverse perspectives
- Report issues privately if they're security-related
- Have fun building! 🚀

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork**: `git clone https://github.com/YOUR_USERNAME/foodstore.git`
3. **Add upstream**: `git remote add upstream https://github.com/ORIGINAL_OWNER/foodstore.git`
4. **Follow [Setup Guide](./SETUP.md)** to install dependencies
5. **Create a feature branch**: `git checkout -b feat/my-feature`

## Git Workflow

### Branches

- **main**: Production-ready code. Protected.
- **develop**: Development branch. PRs go here first.
- **feature/\***: Feature branches (e.g., `feat/product-filter`)
- **fix/\***: Bug fix branches (e.g., `fix/cart-bug`)
- **docs/\***: Documentation branches (e.g., `docs/api-guide`)

### Conventional Commits

All commits must follow **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, missing semicolons, etc)
- `refactor`: Code refactoring without feature changes
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Build, dependency, or tooling changes
- `ci`: CI/CD configuration

**Scope** (optional): `auth`, `products`, `cart`, `api`, `frontend`, etc

**Subject**:
- Imperative mood ("add" not "added" or "adds")
- No capital letter at start
- No period at end
- Maximum 50 characters

**Body** (optional):
- Explain *what* and *why*, not *how*
- Wrap at 72 characters
- Separate from subject with blank line

**Footer** (optional):
- Reference issues: `Closes #42`, `Fixes #123`
- Breaking changes: `BREAKING CHANGE: description`

### Examples

```
feat(auth): add JWT authentication

Implement JWT-based authentication for API endpoints.
Tokens are generated on login and validated on each request.

- Add /auth/login endpoint
- Add middleware for token verification
- Add token refresh mechanism

Closes #42

---

fix(cart): prevent duplicate items

Previously, adding the same item twice would create separate
cart entries. Now, quantity is incremented instead.

Fixes #123

---

docs: update API documentation

Add new endpoint examples for products and orders.

---

chore(deps): update fastapi to 0.136
```

### Commit Process

```bash
# 1. Make changes
git add .

# 2. Commit (hooks will validate)
git commit -m "feat(products): add search filter"

# Pre-commit hooks run:
# - ESLint (frontend)
# - Prettier (frontend)
# - Ruff (backend)
# - Black (backend)

# If hooks fail:
# - Fix issues
# - Stage changes: git add .
# - Commit again: git commit -m "..."

# 3. Push to your fork
git push origin feat/products-search

# 4. Create Pull Request on GitHub
```

## Making Changes

### Frontend (React + TypeScript)

**Structure**:
```tsx
// src/components/ProductCard.tsx
import { FC } from 'react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  onSelect: (id: string) => void;
}

export const ProductCard: FC<ProductCardProps> = ({
  id,
  name,
  price,
  onSelect,
}) => {
  return (
    <div className="product-card" onClick={() => onSelect(id)}>
      <h3>{name}</h3>
      <p>${price}</p>
    </div>
  );
};
```

**Component Guidelines**:
- Use functional components with hooks
- Prefer TypeScript interfaces for props
- Keep components small and focused
- Avoid prop drilling (use Context for shared state)
- Write tests alongside components

**Test Example**:
```tsx
// src/components/ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('displays product info', () => {
    render(
      <ProductCard
        id="1"
        name="Pizza"
        price={12.99}
        onSelect={jest.fn()}
      />
    );
    
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('$12.99')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = jest.fn();
    render(
      <ProductCard
        id="1"
        name="Pizza"
        price={12.99}
        onSelect={onSelect}
      />
    );
    
    await userEvent.click(screen.getByText('Pizza'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

### Backend (FastAPI + Python)

**Structure**:
```python
# app/routes/products.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/products", tags=["products"])

class ProductCreate(BaseModel):
    name: str
    price: float
    description: str = ""

@router.get("/")
async def list_products(skip: int = 0, limit: int = 10):
    """Get all products with pagination."""
    return {
        "products": [],
        "total": 0,
        "page": skip // limit + 1
    }

@router.post("/")
async def create_product(product: ProductCreate):
    """Create a new product."""
    if product.price < 0:
        raise HTTPException(status_code=400, detail="Price must be positive")
    return {"id": "new-id", **product.dict()}
```

**Route Guidelines**:
- Use descriptive names: `list_products`, `get_product_by_id`
- Add docstrings to endpoints
- Use Pydantic models for validation
- Return appropriate HTTP status codes
- Handle errors gracefully

**Test Example**:
```python
# tests/test_products.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.asyncio
async def test_list_products():
    response = client.get("/products/")
    assert response.status_code == 200
    assert "products" in response.json()

@pytest.mark.asyncio
async def test_create_product_invalid_price():
    response = client.post("/products/", json={
        "name": "Pizza",
        "price": -10
    })
    assert response.status_code == 400
```

## Code Quality

### Before Pushing

```bash
# 1. Run all checks
npm run check:all

# 2. Run backend tests specifically
cd backend && python -m pytest

# 3. Check frontend tests
npm run test --workspace frontend

# 4. Review your changes
git diff

# 5. Push to your branch
git push origin feat/my-feature
```

### Pull Request Checks

These run automatically on every PR:
- ✅ ESLint (frontend)
- ✅ Prettier (frontend)
- ✅ Ruff (backend)
- ✅ Black (backend)
- ✅ TypeScript compilation
- ✅ Unit tests (frontend + backend)
- ✅ Build verification
- ✅ Security scanning

All must pass before merging.

## Creating a Pull Request

### Guidelines

1. **Title**: Use Conventional Commits format
   - Good: `feat(cart): add item quantity selector`
   - Bad: `Update files`, `Fix stuff`

2. **Description**: Use this template:
   ```markdown
   ## Description
   Brief explanation of the changes.

   ## Related Issues
   Closes #42

   ## Type of Change
   - [ ] Bug fix
   - [x] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   How did you test this?

   ## Screenshots/Video (if applicable)
   ```

3. **Size**: Keep PRs focused and reviewable
   - Ideal: 100-300 lines changed
   - Large: > 500 lines (request review early)

4. **Reviews**: Wait for at least 1 approval before merging

### Example PR

```markdown
## Add Product Search Filter

Adds ability to search products by name and filter by price range.

## Related Issues
Closes #42

## Type of Change
- [x] New feature

## Changes
- Added SearchBar component
- Added filter logic to ProductService
- Updated ProductList to use filters
- Added tests for new functionality

## Testing
Tested locally by:
1. Searching for "pizza"
2. Filtering by price range $5-$15
3. Verified results update correctly

## Screenshots
[Image of filter UI]
```

## Testing Requirements

### Frontend
- New components must have test files
- Aim for > 80% coverage
- Test user interactions, not implementation

### Backend
- New endpoints must have tests
- Test success and failure cases
- Mock database if needed (Phase 2)

**Run Tests**:
```bash
# Frontend
npm run test --workspace frontend
npm run test:ui --workspace frontend

# Backend
cd backend && python -m pytest
cd backend && python -m pytest --cov=app

# All
npm run test
```

## Documentation

### When to Update Docs

- Adding a new feature → update README
- Changing API structure → update docs/API.md
- New deployment process → update docs/
- Major refactor → update docs/ARCHITECTURE.md

### Docs Format

Use Markdown with:
- Clear headings (H2/H3)
- Code blocks with language: ` ```tsx `
- Links: `[text](url)`
- Lists for procedures
- Examples for clarity

## Questions?

- 📖 Check [SETUP.md](./SETUP.md) for development help
- 📚 Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- 💬 Ask in [GitHub Discussions](https://github.com/yourusername/foodstore/discussions)
- 🐛 Report bugs as [GitHub Issues](https://github.com/yourusername/foodstore/issues)

## Thank You!

Your contributions make Food Store better. We appreciate you! 🙏
