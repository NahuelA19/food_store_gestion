# User Service API Reference

## Overview

The User Service provides endpoints for user profile management, preferences, and admin user management.

**Base URL**: `http://localhost:8000/api`

**Auth Required**: All endpoints except `GET /api/users/{id}` require JWT authentication via `Authorization: Bearer <token>` header.

---

## Endpoints

### 1. Get Current Profile

Get the authenticated user's full profile.

```
GET /api/users/me
```

**Auth**: Required

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

**curl**:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/users/me
```

---

### 2. Get Public Profile

Get a limited public profile of any user.

```
GET /api/users/{user_id}
```

**Auth**: Optional

**Response** (200 OK):
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2026-05-07T12:00:00+00:00"
}
```

**Errors**:
| Status | Detail |
|--------|--------|
| 404 | User not found |

**curl**:
```bash
curl http://localhost:8000/api/users/1
```

---

### 3. Update Profile

Update the authenticated user's profile fields.

```
PUT /api/users/me
```

**Auth**: Required

**Request Body** (all fields optional):
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1-555-987-6543"
}
```

**Response** (200 OK): Full profile with updated fields.

**Errors**:
| Status | Detail |
|--------|--------|
| 401 | Not authenticated |
| 422 | Validation error (invalid phone format, name too long, etc.) |

**curl**:
```bash
curl -X PUT http://localhost:8000/api/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Jane", "phone": "+1-555-987-6543"}'
```

---

### 4. Get Preferences

Get the authenticated user's preferences.

```
GET /api/users/me/preferences
```

**Auth**: Required

**Response** (200 OK):
```json
{
  "language": "en",
  "theme": "light",
  "notifications": "email"
}
```

**curl**:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/users/me/preferences
```

---

### 5. Update Preferences

Update the authenticated user's preferences.

```
PUT /api/users/me/preferences
```

**Auth**: Required

**Request Body** (all fields optional):
```json
{
  "language": "es",
  "theme": "dark",
  "notifications": "push"
}
```

**Valid Values**:

| Key | Allowed Values |
|-----|---------------|
| `language` | `en`, `es`, `fr`, `de` |
| `theme` | `light`, `dark`, `auto` |
| `notifications` | `email`, `push`, `off` |

**Response** (200 OK): All preferences with updated values.

**Errors**:
| Status | Detail |
|--------|--------|
| 401 | Not authenticated |
| 422 | Invalid preference key or value |

**curl**:
```bash
curl -X PUT http://localhost:8000/api/users/me/preferences \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"theme": "dark", "notifications": "push"}'
```

---

### 6. Delete Account

Soft-delete the authenticated user's account.

```
DELETE /api/users/me
```

**Auth**: Required

**Response**: 204 No Content (no body)

**Errors**:
| Status | Detail |
|--------|--------|
| 401 | Not authenticated |

**curl**:
```bash
curl -X DELETE http://localhost:8000/api/users/me \
  -H "Authorization: Bearer <token>"
```

---

### 7. List Users (Admin)

List all users with cursor-based pagination.

```
GET /api/users?cursor={user_id}&limit={count}
```

**Auth**: Required (admin role)

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `cursor` | int | None | User ID to start after (for pagination) |
| `limit` | int | 10 | Number of users per page (1-100) |

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1-555-123-4567",
      "is_active": true,
      "role": "user",
      "created_at": "2026-05-07T12:00:00+00:00",
      "updated_at": "2026-05-07T12:00:00+00:00"
    }
  ],
  "next_cursor": 10
}
```

If `next_cursor` is `null`, there are no more pages.

**Errors**:
| Status | Detail |
|--------|--------|
| 403 | Admin privileges required |

**curl**:
```bash
# First page
curl -H "Authorization: Bearer <admin-token>" http://localhost:8000/api/users

# Paginated
curl -H "Authorization: Bearer <admin-token>" "http://localhost:8000/api/users?cursor=10&limit=20"
```

---

### 8. Update User Status (Admin)

Activate or deactivate a user account.

```
PATCH /api/users/{user_id}/status
```

**Auth**: Required (admin role)

**Request Body**:
```json
{
  "is_active": false
}
```

**Response** (200 OK): Updated user object.

**Errors**:
| Status | Detail |
|--------|--------|
| 403 | Admin privileges required |
| 404 | User not found |

**curl**:
```bash
curl -X PATCH http://localhost:8000/api/users/1/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

---

## Data Validation

### Profile Fields
| Field | Rules |
|-------|-------|
| `first_name` | 1-50 characters, required (but optional on registration) |
| `last_name` | 1-50 characters, required (but optional on registration) |
| `phone` | 7-20 characters, allows `+`, `-`, `()`, spaces, and digits |

### Preference Keys
- `language`: `en`, `es`, `fr`, `de`
- `theme`: `light`, `dark`, `auto`
- `notifications`: `email`, `push`, `off`

### Default Preferences
New users automatically get these defaults:
```json
{
  "language": "en",
  "theme": "light",
  "notifications": "email"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created (registration) |
| 204 | No Content (delete) |
| 401 | Not authenticated |
| 403 | Forbidden (not admin) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email) |
| 422 | Validation error |
