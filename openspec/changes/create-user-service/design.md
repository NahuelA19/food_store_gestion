## Context

**Current state**: Change 3 established authentication (JWT, registration, login). Users can authenticate but have only `id` and `email` in the system.

**Constraints**:
- Must maintain backward compatibility with existing auth (no breaking changes)
- Database schema is already established via Alembic migrations
- Frontend has React Router + AuthContext already set up
- Type safety required (TypeScript + mypy strict mode)
- All CRUD operations must be protected by JWT authentication
- Performance critical for profile lookups (frequent in every request context)

**Stakeholders**:
- Backend: needs ORM model extensions + API endpoints
- Frontend: needs profile page + form components
- Database: needs schema migrations
- Admin workflows (Phase 4): depend on user management endpoints

---

## Goals / Non-Goals

**Goals:**
- ✅ Extend User model with profile fields (first_name, last_name, phone)
- ✅ Create scalable user preferences storage (language, theme, notifications)
- ✅ Implement 5-7 REST endpoints for user CRUD (protected by JWT)
- ✅ Add frontend profile page with edit capability
- ✅ Maintain backward compatibility with existing auth
- ✅ Add comprehensive unit tests for all endpoints
- ✅ Add input validation (lengths, formats, uniqueness)

**Non-Goals:**
- ❌ User roles/permissions system (Phase 4: build-admin-dashboard)
- ❌ User impersonation or admin override (Phase 4)
- ❌ Soft delete with restore functionality (only soft delete, not restore)
- ❌ Preference versioning/history (simple current value)
- ❌ Profile image/avatar uploads (no file storage yet)
- ❌ Email change workflow (requires email verification, Phase 3+)
- ❌ Phone verification (scope creep, not MVP)

---

## Decisions

### Decision 1: Separate tables for profiles vs. preferences
**Choice**: Two tables — `users` (extended with nullable profile columns) + `user_preferences` (separate table)

**Rationale**:
- Profile fields (first_name, last_name, phone) are frequently queried together → keep in main User table
- Preferences are sparse (users may not set all prefs) + scalable (new prefs added over time) → separate table
- Avoids NULL bloat in users table
- Easier to add new preferences without migrations

**Alternatives considered**:
- Single `users` table with all fields → violates normalization, preference queries cause full table scans
- JSONB preferences column → loses type safety + harder to query individual preferences
- Caching layer (Redis) → adds complexity, defer to Phase 5

### Decision 2: PUT vs. PATCH for profile updates
**Choice**: Use `PUT /api/users/me` for profile, `PUT /api/users/me/preferences` for preferences

**Rationale**:
- Profile is atomic (first_name, last_name, phone always updated together)
- Preferences are sparse → each preference is independent (would suggest PATCH, but simpler to batch as one PUT)
- Consistent with Change 3 auth endpoints (PUT for state updates)
- Simpler client code (no need to track which fields changed)

**Alternatives considered**:
- PATCH for fine-grained updates → overkill for profile, adds request size overhead
- Separate endpoints per field → REST fragmentation, too many endpoints

### Decision 3: Soft delete with immediate hard delete
**Choice**: Soft delete in database (add `deleted_at` column), but API immediately hard-deletes user data

**Rationale**:
- Soft delete preserves order history + audit trail (needed for Phase 3: orders)
- User data deleted immediately for GDPR compliance
- `DELETE /api/users/me` soft-deletes but user can't recover
- Admin can (later) restore soft-deleted users

**Alternatives considered**:
- Hard delete only → loses order history, violates audit requirements
- Soft delete without hard delete → GDPR violation, user data retained forever
- Two-phase delete (soft first, hard after 30 days) → adds complexity, defer to later

### Decision 4: Pagination for admin user list
**Choice**: Include `GET /api/users` admin-only endpoint with cursor-based pagination (not offset)

**Rationale**:
- Cursor-based pagination scales better with large user bases (Phase 5+)
- No offset-based "offset by 10M" attacks possible
- Consistent with async pagination patterns (async + offset = slow queries)
- Frontend doesn't need initial admin user list MVP

**Alternatives considered**:
- Offset-based pagination → simpler, but inefficient at scale (Phase 5 technical debt)
- GraphQL relay cursors → overkill for REST API
- No pagination → n+1 queries if many users

### Decision 5: Preference values as TEXT, not ENUM
**Choice**: Store preference values as TEXT (e.g., language="en", theme="dark")

**Rationale**:
- Flexible for future preferences (no migration needed per new value)
- Frontend validation ensures type safety (Pydantic enum fields)
- Lookup performance same as ENUM
- Easier to add new options (theme="auto" later)

**Alternatives considered**:
- Database ENUM type → requires migration to add new values, less flexible
- Separate preference_options table → over-engineered for MVP

### Decision 6: JWT does NOT include profile data
**Choice**: JWT includes only `user_id` + `email`. Profile fetched via `GET /api/users/me`

**Rationale**:
- JWT expiration (15 min) means profile changes take 15 min to reflect
- Profile rarely changes → separate fetch is acceptable trade-off
- Keeps JWT small + stateless
- Clear separation: auth = JWT, profile = REST endpoint

**Alternatives considered**:
- Include profile in JWT → stale data until token refresh, added complexity
- Refresh profile on every request → excessive database queries
- Include in JWT + refresh on write → defeats stateless JWT advantage

---

## Risks / Trade-offs

### Risk 1: NULL profile fields break type safety
**Mitigation**: 
- Make profile fields `NOT NULL` in database (set defaults on registration if needed)
- Pydantic models require all fields (no Optional)
- If field not provided, set empty string "" (not NULL)

### Risk 2: Orphaned preferences after soft delete
**Mitigation**:
- ON DELETE CASCADE for preferences foreign key
- Soft-deleted users' preferences still soft-deleted (consistent)
- Audit trail preserved via deleted_at timestamp

### Risk 3: Preferences table query N+1
**Mitigation**:
- Always fetch preferences in one query (`SELECT * WHERE user_id = ?`)
- Add composite index on (user_id, pref_key)
- Prefer batch loads in admin dashboard (Phase 4)

### Risk 4: Phone format validation too strict
**Mitigation**:
- Use regex: `^\+?[0-9\-\(\)\s]{7,}$` (loose, allows international)
- No strict country-specific validation (MVp)
- Document format in API docs (example: "+1-555-123-4567" or "5551234567")

### Risk 5: Admin user list endpoint leaked to regular users
**Mitigation**:
- Explicit role check in endpoint: `if current_user.role != "admin": raise HTTPException(403)`
- No assumptions — explicitly verify role before any admin action
- Add middleware check in design.md

### Trade-off: Profile completeness not enforced
- **Trade-off**: Users can skip profile fields (all nullable on registration)
- **Reason**: MVP doesn't mandate onboarding flow
- **Future**: Phase 4 can add mandatory profile completion checks if needed

---

## Migration Plan

### Pre-deployment
1. Create Alembic migration: add columns to users + create user_preferences table
2. Run migration in staging database, verify no data loss
3. Rollback and re-run to test idempotency

### Deployment
1. Run migration: `alembic upgrade head`
2. Backfill existing users with empty profile fields (NULL → "")
3. Deploy backend code (routes, models, tests)
4. Deploy frontend code (profile page, form components)
5. Smoke test: register new user → set profile → fetch profile

### Rollback (if needed)
1. Stop backend/frontend
2. Run `alembic downgrade -1` to revert migration
3. Restart with previous code version
4. No data loss (migration only adds columns, doesn't delete)

---

## Open Questions

1. **Should profile fields be required on registration?**
   - Currently: optional (skip onboarding)
   - Option A: Make required (mandate onboarding)
   - Option B: Defer to Phase 4 (make required later when admin dashboard available)
   - Decision pending: team preference

2. **Should phone number be stored encrypted?**
   - Currently: plain text
   - PII sensitivity: medium (not as sensitive as password)
   - Decision: defer to Phase 6 (production-hardening) if compliance required

3. **What preferences should we support in Phase 2?**
   - Currently: language, theme, notifications
   - Alternatives: timezone, email frequency, etc.
   - Decision pending: product requirements

4. **Should we add user avatar/profile picture in this change?**
   - Currently: no (out of scope)
   - File storage needed (S3, CDN)
   - Decision: Phase 6 (containerize-application, setup-cdn-assets)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Frontend                                                │
│  - ProfilePage.tsx ──→ useAuth.updateProfile()         │
│  - UserForm.tsx ──→ PUT /api/users/me                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Backend API (FastAPI)                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ GET  /api/users/me              (protected)    │   │
│  │ GET  /api/users/{id}            (protected)    │   │
│  │ PUT  /api/users/me              (protected)    │   │
│  │ PUT  /api/users/me/preferences  (protected)    │   │
│  │ DELETE /api/users/me            (protected)    │   │
│  │ GET  /api/users                 (admin-only)   │   │
│  │ PATCH /api/users/{id}/status    (admin-only)   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Database (PostgreSQL)                                   │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │ users                │  │ user_preferences     │    │
│  │ ─────────────────    │  │ ──────────────────   │    │
│  │ id (PK)              │  │ id (PK)              │    │
│  │ email                │  │ user_id (FK)         │    │
│  │ hashed_password      │  │ pref_key             │    │
│  │ is_active            │  │ pref_value           │    │
│  │ first_name           │  │ created_at           │    │
│  │ last_name            │  │ updated_at           │    │
│  │ phone                │  │ (unique: user_id +   │    │
│  │ created_at           │  │  pref_key)           │    │
│  │ updated_at           │  └──────────────────────┘    │
│  │ deleted_at (soft)    │                              │
│  └──────────────────────┘                              │
│   Indexes: (email), (is_active, created_at)           │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Sequence (for tasks.md)

1. **Database**: Create Alembic migration (add columns + preferences table)
2. **Backend**: Extend User ORM model
3. **Backend**: Create Pydantic models (UserProfile, UserPreference, UserUpdate)
4. **Backend**: Create routes.users module with 7 endpoints
5. **Backend**: Add unit tests (test_users_crud.py, test_users_auth.py, test_users_validation.py)
6. **Frontend**: Create ProfilePage.tsx component
7. **Frontend**: Create UserForm.tsx component
8. **Frontend**: Update useAuth hook with updateProfile(), updatePreferences()
9. **Frontend**: Add tests (ProfilePage.test.tsx, UserForm.test.tsx)
10. **Documentation**: Create docs/USER-SERVICE.md, update docs/AUTHENTICATION.md
11. **Verification**: Full test suite, linting, integration tests
