# Writing Tests

Guide to writing unit and integration tests for Food Store.

## Frontend Tests (React + Vitest)

### Basic Component Test

**File**: `frontend/src/components/Button.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button label="Click me" onClick={jest.fn()} />);
    
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button label="Click" onClick={onClick} />);
    
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<Button label="Click" onClick={jest.fn()} disabled={true} />);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Testing with API Calls

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { ProductList } from './ProductList';
import * as productService from '@services/productService';

jest.mock('@services/productService');

describe('ProductList', () => {
  it('fetches and displays products', async () => {
    const mockProducts = [
      { id: '1', name: 'Pizza', price: 15.99 },
    ];
    
    jest.mocked(productService.getProducts).mockResolvedValue(mockProducts);
    
    render(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    jest.mocked(productService.getProducts).mockRejectedValue(
      new Error('Network error')
    );
    
    render(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Testing Hooks

```tsx
import { renderHook, act } from '@testing-library/react';
import { useCart } from '@hooks/useCart';

describe('useCart', () => {
  it('adds item to cart', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ id: '1', name: 'Pizza', price: 15.99 });
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(15.99);
  });

  it('removes item from cart', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ id: '1', name: 'Pizza', price: 15.99 });
      result.current.removeItem('1');
    });
    
    expect(result.current.items).toHaveLength(0);
  });
});
```

## Backend Tests (FastAPI + Pytest)

### Basic Endpoint Test

**File**: `backend/tests/test_products.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.asyncio
async def test_list_products():
    response = client.get("/products/")
    
    assert response.status_code == 200
    data = response.json()
    assert "products" in data

@pytest.mark.asyncio
async def test_get_featured_products():
    response = client.get("/products/featured?limit=5")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["products"]) <= 5

@pytest.mark.asyncio
async def test_create_product():
    payload = {
        "name": "Pizza",
        "price": 15.99,
        "description": "Delicious pizza"
    }
    response = client.post("/products/", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Pizza"
```

### Testing Validation

```python
@pytest.mark.asyncio
async def test_create_product_invalid_price():
    payload = {
        "name": "Pizza",
        "price": -10,  # Invalid!
        "description": ""
    }
    response = client.post("/products/", json=payload)
    
    assert response.status_code == 400
    assert "price" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_list_products_invalid_limit():
    response = client.get("/products/?limit=1000")
    
    assert response.status_code == 400
```

### Testing with Fixtures

```python
import pytest

@pytest.fixture
def sample_product():
    return {
        "name": "Pizza",
        "price": 15.99,
        "description": "Delicious"
    }

@pytest.mark.asyncio
async def test_create_product_with_fixture(sample_product):
    response = client.post("/products/", json=sample_product)
    
    assert response.status_code == 201

@pytest.fixture
def auth_headers():
    # Mock JWT token
    return {"Authorization": "Bearer fake-token"}

@pytest.mark.asyncio
async def test_create_order_authenticated(auth_headers):
    payload = {"items": [{"id": "1", "quantity": 1}]}
    response = client.post("/orders/", json=payload, headers=auth_headers)
    
    assert response.status_code == 201
```

### Testing Database Queries (Phase 2)

```python
import pytest
from sqlalchemy import create_engine
from app.database import Base, SessionLocal
from app.models import User

@pytest.fixture(scope="session")
def db():
    """Create in-memory database for testing"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return TestingSessionLocal()

@pytest.mark.asyncio
async def test_create_user(db):
    user = User(email="test@example.com", password_hash="hashed")
    db.add(user)
    db.commit()
    
    fetched = db.query(User).filter(User.email == "test@example.com").first()
    assert fetched.email == "test@example.com"
```

## Test Structure Best Practices

### Arrange-Act-Assert (AAA)

```python
# ✅ Good: Clear test structure
def test_calculate_total():
    # Arrange
    cart = Cart()
    cart.add_item({"price": 10})
    cart.add_item({"price": 5})
    
    # Act
    total = cart.get_total()
    
    # Assert
    assert total == 15

# ❌ Bad: Unclear flow
def test_calculate_total():
    cart = Cart()
    cart.add_item({"price": 10})
    cart.add_item({"price": 5})
    assert cart.get_total() == 15
```

### Descriptive Test Names

```python
# ✅ Good: Name describes what is tested
def test_add_item_increases_cart_count():
    pass

def test_remove_nonexistent_item_raises_error():
    pass

# ❌ Bad: Vague names
def test_add():
    pass

def test_remove():
    pass
```

### Test Coverage

```bash
# Frontend
npm run test --workspace frontend -- --coverage

# Backend
cd backend && python -m pytest --cov=app --cov-report=html

# View coverage report
open htmlcov/index.html
```

Target: > 80% coverage

## Common Testing Patterns

### Mocking API Responses

```tsx
// Frontend
jest.mock('@services/api', () => ({
  fetchProducts: jest.fn(() => 
    Promise.resolve([{ id: '1', name: 'Pizza' }])
  ),
}));

// Backend
from unittest.mock import patch

@patch('app.services.stripe.charge')
def test_payment(mock_charge):
    mock_charge.return_value = {"status": "succeeded"}
    # Test payment flow
```

### Testing Edge Cases

```python
def test_empty_cart():
    cart = Cart()
    assert cart.total == 0
    assert len(cart.items) == 0

def test_negative_quantity_not_allowed():
    cart = Cart()
    with pytest.raises(ValueError):
        cart.add_item({"id": "1", "quantity": -5})

def test_very_large_order():
    cart = Cart()
    for i in range(10000):
        cart.add_item({"id": str(i), "price": 1})
    assert cart.total == 10000
```

## Running Tests

### Frontend

```bash
# Run all tests
npm run test --workspace frontend

# Watch mode
npm run test --workspace frontend -- --watch

# With UI
npm run test:ui --workspace frontend

# Coverage
npm run test --workspace frontend -- --coverage
```

### Backend

```bash
# Run all tests
cd backend && python -m pytest

# Verbose output
cd backend && python -m pytest -v

# Run specific file
cd backend && python -m pytest tests/test_products.py

# Run specific test
cd backend && python -m pytest tests/test_products.py::test_list_products

# Coverage
cd backend && python -m pytest --cov=app --cov-report=term-missing
```

## Checklist

- [ ] Tests written for new code
- [ ] Edge cases covered
- [ ] Mocks used for external dependencies
- [ ] Test names are descriptive
- [ ] Tests are independent and don't share state
- [ ] Coverage > 80%
- [ ] All tests pass locally
- [ ] Tests pass in CI/CD pipeline
