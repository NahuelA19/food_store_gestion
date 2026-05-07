# Authentication Guide

## Overview

Food Store uses **JWT (JSON Web Token)** based authentication with bcrypt password hashing.

### Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Frontend      │  HTTP   │   Backend        │  SQL    │  PostgreSQL  │
│   React + TS    │◄───────►│   FastAPI        │◄───────►│  Database    │
└─────────────────┘         └──────────────────┘         └──────────────┘
      │                            │
      │  localStorage              │  bcrypt
      │  (JWT persistence)         │  (password hashing)
      │                            │  HS256 (JWT signing)
```

### Flow

1. **Register**: User submits email + password → backend hashes password → stores in DB → returns JWT
2. **Login**: User submits email + password → backend verifies hash → returns JWT
3. **Authenticated Request**: Frontend sends `Authorization: Bearer <token>` → backend validates JWT → returns protected data
4. **Logout**: Frontend clears localStorage

---

## Backend API

### Register

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'
```

**Response** (201 Created):
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": null,
  "last_name": null,
  "phone": null,
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**With optional profile fields:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123","first_name":"John","last_name":"Doe","phone":"+1-555-123-4567"}'
```

**Response with profile** (201 Created):
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1-555-123-4567",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Errors**:
| Status | Cause |
|--------|-------|
| 409 | Email already registered |
| 422 | Invalid email format or weak password |

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1-555-123-4567",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Errors**:
| Status | Cause |
|--------|-------|
| 401 | Invalid credentials |
| 403 | Account is inactive |

### Protected Endpoint

```bash
curl http://localhost:8000/api/health/protected/test \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response** (200 OK):
```json
{
  "status": "ok",
  "user_id": 1,
  "user_email": "user@example.com"
}
```

---

### Fetch Profile After Login

After logging in, fetch the user's full profile:

```bash
curl http://localhost:8000/api/users/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1-555-123-4567",
  "created_at": "2026-05-07T12:00:00+00:00",
  "updated_at": "2026-05-07T12:00:00+00:00"
}
```

For the complete User Service API reference (profile CRUD, preferences, admin endpoints), see [docs/USER-SERVICE.md](./USER-SERVICE.md).

---

## Backend: Using Protected Routes

### With Dependency Injection

```python
from fastapi import APIRouter, Depends
from app.models.user import User
from app.security.auth import get_current_user

router = APIRouter(prefix="/my-resource", tags=["my-resource"])


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> dict:
    """Only authenticated users can access this."""
    return {
        "id": current_user.id,
        "email": current_user.email,
    }
```

### File Structure

```
backend/app/
├── security/
│   ├── password.py    # bcrypt hashing + validation
│   ├── jwt.py         # JWT creation + verification
│   └── auth.py        # get_current_user() dependency
├── routes/
│   └── auth.py        # POST /register, POST /login
└── models/
    └── auth.py        # RegisterRequest, LoginRequest, AuthResponse
```

---

## Frontend: Using useAuth Hook

### Basic Usage

```tsx
import { useAuthContext } from "../context/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, login, logout, error, isLoading } = useAuthContext();

  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }

  return <p>Welcome, {user?.email}!</p>;
}
```

### Login Form

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      // Error is available in context.error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Loading..." : "Login"}
      </button>
    </form>
  );
}
```

### Protected Routes

```tsx
import { ProtectedRoute } from "../components/ProtectedRoute";

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

---

## Password Requirements

| Rule | Example |
|------|---------|
| Minimum 8 characters | ❌ `pass1` → ✅ `Password1` |
| At least 1 uppercase | ❌ `password1` → ✅ `Password1` |
| At least 1 digit | ❌ `Password` → ✅ `Password1` |

---

## Token Expiration

| Setting | Value |
|---------|-------|
| Algorithm | HS256 |
| Default expiration | 15 minutes |
| Configurable via | `ACCESS_TOKEN_EXPIRE_MINUTES` in `.env` |

### Refresh Strategy (Phase 2)

Token refresh is NOT implemented yet. After 15 minutes, the user will need to log in again.
Future enhancement: implement refresh tokens for seamless session renewal.

---

## Testing

### Backend Tests

```bash
cd backend && python -m pytest tests/test_auth_routes.py tests/test_auth_middleware.py tests/test_security_password.py tests/test_security_jwt.py -v
```

### Frontend Tests

```bash
npm run test --workspace frontend
```

---

*Last updated: 2026-05-06*
