## Why

Change 3 (implement-authentication) established **who users are** (registration, login, JWT tokens).  
Change 4 extends this by establishing **what we can DO with users** (profiles, preferences, management).

Without user profiles and CRUD operations, authenticated users have no personalization or data beyond their email. This blocks:
- User preferences (language, theme, notifications)
- Order history and wishlist (Phase 3, 4)
- Admin dashboards (Phase 4)
- Recommendation engine (Phase 4)

**Why now**: Change 3 is complete. User service is a foundational Phase 2 feature with no external dependencies.

## What Changes

### Backend
- New `User` ORM model extensions: `profile` (first_name, last_name, phone), `preferences` (language, theme, notifications)
- Create `backend/app/routes/users.py` with 5-7 endpoints:
  - `GET /api/users/me` — current user profile
  - `GET /api/users/{id}` — public user info (limited fields)
  - `PUT /api/users/me` — update own profile
  - `PUT /api/users/me/preferences` — update preferences
  - `DELETE /api/users/me` — delete own account (soft delete)
  - Optional: `GET /api/users` (admin-only paginated list)
  - Optional: `PATCH /api/users/{id}/status` (admin-only activate/deactivate)
- Add Alembic migration for new User columns
- Add unit tests for CRUD endpoints
- Add validation: email uniqueness, profile field lengths, preference constraints

### Frontend
- Create `frontend/src/pages/ProfilePage.tsx` — view and edit own profile
- Create `frontend/src/components/UserForm.tsx` — reusable form for profile editing
- Add route: `/profile` — protected, requires authentication
- Update `useAuth` hook with `updateProfile()`, `updatePreferences()` methods
- Add validation: name length, phone format

### Database
- Extend `User` table with nullable profile fields (backcompat)
- Create `user_preferences` table for scalable preference storage
- Add indexes on frequently queried fields (user_id, email)

### Documentation
- Update `docs/AUTHENTICATION.md` with user profile examples
- Create `docs/USER-SERVICE.md` with API reference and usage guide

## Capabilities

### New Capabilities
- `user-profiles`: User profile management (first_name, last_name, phone, created_at, updated_at)
- `user-preferences`: User preference storage and retrieval (language, theme, notifications, etc.)
- `user-management-api`: REST API for CRUD operations on user data (protected by authentication)
- `user-validation`: Input validation for profile fields (lengths, formats, uniqueness constraints)

### Modified Capabilities
- `user-auth`: ← Needs delta spec
  - **Change**: Add profile completion check on registration (optional onboarding flow)
  - **Change**: Include user profile data in JWT claims or in `GET /api/users/me` response
  - No breaking changes to existing auth endpoints, but auth context now includes profile info

## Impact

### Code Changes
- `backend/app/models/user.py` — extend User ORM model
- `backend/app/routes/users.py` — new file, 150-200 LOC
- `backend/app/models/user_profile.py` — new Pydantic models
- `backend/tests/test_users_*.py` — new test files
- `frontend/src/pages/ProfilePage.tsx` — new file
- `frontend/src/components/UserForm.tsx` — new file
- Database migrations — new Alembic file

### APIs Introduced
- `GET /api/users/me` — get current user profile
- `GET /api/users/{id}` — get public user info
- `PUT /api/users/me` — update profile
- `PUT /api/users/me/preferences` — update preferences
- `DELETE /api/users/me` — delete account
- Optional: `GET /api/users` (admin), `PATCH /api/users/{id}/status` (admin)

### Dependencies Added
- None (uses existing: FastAPI, SQLAlchemy, asyncpg, Pydantic)

### No Breaking Changes
- Existing auth endpoints remain unchanged
- New endpoints only add functionality, don't modify existing behavior
- Database migration is backward-compatible (new nullable columns)

### Blocks
- Change 5 (create-product-service) — can start in parallel, optional dependency
- Change 8 (implement-order-management) — requires user profiles for order context
- Change 13 (build-admin-dashboard) — requires user management APIs
- Phase 4 features (wishlists, recommendations, reviews) — depend on user profiles

### Unblocks
- Frontend to call `/api/users/me` for profile display
- Preference-driven features (theme switching, language selection)
- Admin user management workflows
