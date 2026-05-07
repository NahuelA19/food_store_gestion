## 1. Database Schema & Migrations

- [ ] 1.1 Create Alembic migration file for user table extensions
- [ ] 1.2 Add columns to users table: first_name VARCHAR(50), last_name VARCHAR(50), phone VARCHAR(20), deleted_at TIMESTAMP (nullable)
- [ ] 1.3 Create user_preferences table: id, user_id (FK), pref_key, pref_value, created_at, updated_at
- [ ] 1.4 Add composite unique index on (user_id, pref_key) for user_preferences
- [ ] 1.5 Add index on users(is_active, created_at) for admin user listing
- [ ] 1.6 Run migration: `alembic upgrade head`
- [ ] 1.7 Verify migration doesn't lose existing user data (backcompat test)

## 2. Backend ORM Model Extensions

- [ ] 2.1 Update User model in backend/app/models/user.py with new fields: first_name, last_name, phone, deleted_at
- [ ] 2.2 Add type hints to all new fields (str, Optional[str], Optional[datetime])
- [ ] 2.3 Create UserPreference ORM model in backend/app/models/user.py
- [ ] 2.4 Add relationship between User and UserPreference (one-to-many)
- [ ] 2.5 Update User.__repr__ to include new fields for debugging

## 3. Backend Pydantic Models

- [ ] 3.1 Create UserProfile schema in backend/app/models/user_profile.py with fields: first_name, last_name, phone
- [ ] 3.2 Create UserProfileUpdate schema (same fields, all optional)
- [ ] 3.3 Create UserPreference schema with fields: pref_key, pref_value
- [ ] 3.4 Create UserPreferenceUpdate schema (all preferences to update as dict)
- [ ] 3.5 Create UserResponse schema for public API responses (id, email, first_name, last_name, created_at, updated_at)
- [ ] 3.6 Create UserPublicResponse schema for public profile endpoints (id, first_name, last_name, created_at only)
- [ ] 3.7 Add validation to UserProfile: first_name/last_name 1-50 chars, phone regex pattern
- [ ] 3.8 Add validation to UserPreference: pref_key in ["language", "theme", "notifications"], pref_value in allowed list

## 4. Backend Validation Utilities

- [ ] 4.1 Create backend/app/validation/user_validation.py module
- [ ] 4.2 Create validate_profile_name(name: str) -> bool function (1-50 chars, no special chars)
- [ ] 4.3 Create validate_phone(phone: str) -> bool function (regex: ^\+?[0-9\-\(\)\s]{7,20}$)
- [ ] 4.4 Create validate_preference_key(key: str) -> bool function (check against allowed list)
- [ ] 4.5 Create validate_preference_value(key: str, value: str) -> bool function (check against allowed values per key)
- [ ] 4.6 Add unit tests for validation functions in backend/tests/test_validation.py

## 5. Backend Routes: Get Profile Endpoints

- [ ] 5.1 Create backend/app/routes/users.py file with router
- [ ] 5.2 Implement GET /api/users/me endpoint: return current user's full profile
- [ ] 5.3 Implement GET /api/users/{user_id} endpoint: return public profile (limited fields)
- [ ] 5.4 Add route protection: @require_auth for /me, optional for /{user_id}
- [ ] 5.5 Add error handling: 401 for missing auth, 404 for non-existent user
- [ ] 5.6 Update backend/app/main.py to include users router: app.include_router(users_router, prefix="/api")

## 6. Backend Routes: Update Profile Endpoint

- [ ] 6.1 Implement PUT /api/users/me endpoint: update current user's profile
- [ ] 6.2 Extract JWT from request to get current_user
- [ ] 6.3 Validate input using UserProfileUpdate schema
- [ ] 6.4 Update database: User.first_name, User.last_name, User.phone, User.updated_at
- [ ] 6.5 Return updated profile with HTTP 200
- [ ] 6.6 Add error handling: 422 for validation errors, 401 for missing auth

## 7. Backend Routes: Preferences Endpoints

- [ ] 7.1 Implement GET /api/users/me/preferences endpoint: fetch all user preferences
- [ ] 7.2 Fetch from user_preferences table filtered by user_id
- [ ] 7.3 Return dict of {pref_key: pref_value, ...} with HTTP 200
- [ ] 7.4 Initialize default preferences for new users (language=en, theme=light, notifications=email)
- [ ] 7.5 Implement PUT /api/users/me/preferences endpoint: update preferences
- [ ] 7.6 Accept dict of {pref_key: pref_value, ...} in request body
- [ ] 7.7 Validate each pref_key and pref_value using validation functions
- [ ] 7.8 Upsert into user_preferences table (insert if not exists, update if exists)
- [ ] 7.9 Return all preferences with HTTP 200
- [ ] 7.10 Add error handling: 422 for invalid preference values, 401 for missing auth

## 8. Backend Routes: Delete Account Endpoint

- [ ] 8.1 Implement DELETE /api/users/me endpoint: soft-delete current user
- [ ] 8.2 Set User.deleted_at = current_timestamp
- [ ] 8.3 Return HTTP 204 No Content (no response body)
- [ ] 8.4 Ensure deleted users cannot login (check is_active AND deleted_at IS NULL)
- [ ] 8.5 Ensure deleted users not returned in GET /api/users/{id} (404)

## 9. Backend Routes: Admin Endpoints

- [ ] 9.1 Implement GET /api/users endpoint: admin-only list all users with pagination
- [ ] 9.2 Add role/permission check: only users with admin role can call this endpoint
- [ ] 9.3 Implement cursor-based pagination: accept ?cursor=<cursor>&limit=10 parameters
- [ ] 9.4 Query users: SELECT * FROM users WHERE id > cursor_id ORDER BY id LIMIT limit+1
- [ ] 9.5 Generate next_cursor from last user's ID if more results exist
- [ ] 9.6 Return array of users + next_cursor with HTTP 200
- [ ] 9.7 Implement PATCH /api/users/{user_id}/status endpoint: admin-only deactivate user
- [ ] 9.8 Add role check: only admin users can deactivate other users
- [ ] 9.9 Update User.is_active based on request body {"is_active": true/false}
- [ ] 9.10 Return updated user with HTTP 200

## 10. Backend Tests: Unit Tests for Routes

- [ ] 10.1 Create backend/tests/test_users_profile.py
- [ ] 10.2 Test GET /api/users/me with valid JWT: assert profile fields returned
- [ ] 10.3 Test GET /api/users/me without JWT: assert 401 Unauthorized
- [ ] 10.4 Test GET /api/users/{id} public profile: assert limited fields (no email, no phone)
- [ ] 10.5 Test GET /api/users/{id} non-existent user: assert 404 Not Found
- [ ] 10.6 Create backend/tests/test_users_update.py
- [ ] 10.7 Test PUT /api/users/me with valid profile: assert updated in database
- [ ] 10.8 Test PUT /api/users/me with invalid phone: assert 422 Unprocessable Entity
- [ ] 10.9 Test PUT /api/users/me without JWT: assert 401 Unauthorized
- [ ] 10.10 Test DELETE /api/users/me: assert soft-delete (deleted_at set)
- [ ] 10.11 Test deleted user cannot login: attempt login, assert 401
- [ ] 10.12 Create backend/tests/test_users_preferences.py
- [ ] 10.13 Test GET /api/users/me/preferences: assert default preferences returned
- [ ] 10.14 Test PUT /api/users/me/preferences with valid values: assert updated in database
- [ ] 10.15 Test PUT /api/users/me/preferences with invalid value: assert 422
- [ ] 10.16 Create backend/tests/test_users_admin.py
- [ ] 10.17 Test GET /api/users as regular user: assert 403 Forbidden
- [ ] 10.18 Test GET /api/users as admin: assert paginated list returned
- [ ] 10.19 Test PATCH /api/users/{id}/status as admin: assert is_active updated
- [ ] 10.20 Test PATCH /api/users/{id}/status as regular user: assert 403 Forbidden

## 11. Backend: Update Authentication for Profiles

- [ ] 11.1 Update POST /api/auth/register to accept optional profile fields: first_name, last_name, phone
- [ ] 11.2 Validate profile fields on registration if provided (same validation as PUT /users/me)
- [ ] 11.3 Store profile fields in User record on registration
- [ ] 11.4 Initialize user preferences with defaults on registration
- [ ] 11.5 Update login response to include user profile: {access_token, token_type, user: {id, email, first_name, last_name, phone}}
- [ ] 11.6 Update registration response to include user profile
- [ ] 11.7 Add tests: registration with profile fields, registration response includes profile

## 12. Backend: Code Quality

- [ ] 12.1 Run ruff check backend/ — fix any linting errors
- [ ] 12.2 Run black --check backend/ — check formatting (auto-fix if needed)
- [ ] 12.3 Run mypy backend/app/routes/users.py --strict — verify type hints
- [ ] 12.4 Run pytest backend/tests/ -v — all tests pass (target: 100% pass rate)
- [ ] 12.5 Check test coverage: pytest --cov=app backend/tests/ — target: >80% coverage

## 13. Frontend: Profile Page Component

- [ ] 13.1 Create frontend/src/pages/ProfilePage.tsx
- [ ] 13.2 Add useAuth() hook to get current user
- [ ] 13.3 Add useState for form fields: first_name, last_name, phone, isEditing
- [ ] 13.4 Display profile in view mode (read-only)
- [ ] 13.5 Add "Edit" button to toggle edit mode
- [ ] 13.6 Show profile form (UserForm component) in edit mode
- [ ] 13.7 Call useAuth().updateProfile() on form submit
- [ ] 13.8 Handle loading state while updating
- [ ] 13.9 Show success/error messages after update
- [ ] 13.10 Add route in App.tsx: <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

## 14. Frontend: User Form Component

- [ ] 14.1 Create frontend/src/components/UserForm.tsx
- [ ] 14.2 Accept props: initialValues (profile data), onSubmit (callback), isLoading
- [ ] 14.3 Add form fields: first_name (text input), last_name (text input), phone (tel input)
- [ ] 14.4 Add validation: first_name/last_name 1-50 chars, phone format validation
- [ ] 14.5 Display validation errors inline below each field
- [ ] 14.6 Add submit button with loading state
- [ ] 14.7 Handle form submission with onSubmit callback

## 15. Frontend: useAuth Hook Update

- [ ] 15.1 Update frontend/src/hooks/useAuth.ts
- [ ] 15.2 Add updateProfile(profile) method: call PUT /api/users/me
- [ ] 15.3 Add updatePreferences(prefs) method: call PUT /api/users/me/preferences
- [ ] 15.4 Add getPreferences() method: call GET /api/users/me/preferences
- [ ] 15.5 Handle API errors and set error state
- [ ] 15.6 Update user state after successful profile update
- [ ] 15.7 Persist updated profile to localStorage (if storing user object)

## 16. Frontend: Navigation Bar Update

- [ ] 16.1 Update frontend/src/components/Navigation.tsx
- [ ] 16.2 Add "Profile" link in authenticated user menu: conditionally show if logged in
- [ ] 16.3 Link points to /profile route
- [ ] 16.4 Test navigation works from any page

## 17. Frontend: Tests

- [ ] 17.1 Create frontend/src/__tests__/ProfilePage.test.tsx
- [ ] 17.2 Test ProfilePage renders profile in view mode
- [ ] 17.3 Test "Edit" button toggles edit mode
- [ ] 17.4 Test form submission calls updateProfile
- [ ] 17.5 Test error message displayed on update failure
- [ ] 17.6 Test success message displayed on update success
- [ ] 17.7 Create frontend/src/__tests__/UserForm.test.tsx
- [ ] 17.8 Test form validates first_name length
- [ ] 17.9 Test form validates phone format
- [ ] 17.10 Test form submit button disabled while loading
- [ ] 17.11 Test form displays validation errors inline

## 18. Frontend: Preferences UI (Optional MVP)

- [ ] 18.1 Create frontend/src/components/PreferencesPanel.tsx (optional for Phase 2)
- [ ] 18.2 Display language, theme, notifications selections
- [ ] 18.3 Add radio buttons or dropdowns for each preference
- [ ] 18.4 Call useAuth().updatePreferences() on change
- [ ] 18.5 Add to ProfilePage as a second section (optional)

## 19. Documentation

- [ ] 19.1 Create docs/USER-SERVICE.md with API reference
- [ ] 19.2 Document all 7 endpoints: GET /users/me, GET /users/{id}, PUT /users/me, etc.
- [ ] 19.3 Add request/response examples for each endpoint (using curl)
- [ ] 19.4 Add authentication requirements for each endpoint
- [ ] 19.5 Update docs/AUTHENTICATION.md with profile examples (registration with profile, profile fetch after login)
- [ ] 19.6 Update README.md with link to USER-SERVICE.md
- [ ] 19.7 Add JSDoc comments to all route handlers and functions
- [ ] 19.8 Document database schema changes in docs/DATABASE.md

## 20. Integration Testing & Verification

- [ ] 20.1 Start backend dev server with PostgreSQL running
- [ ] 20.2 Start frontend dev server
- [ ] 20.3 Test E2E flow: register with profile → login → navigate to /profile → view profile
- [ ] 20.4 Test E2E: edit profile → submit → verify update in UI
- [ ] 20.5 Test E2E: update preferences → verify persisted after reload
- [ ] 20.6 Test E2E: delete account → verify cannot login with same email
- [ ] 20.7 Run full test suite: npm run test
- [ ] 20.8 Run linting: npm run lint
- [ ] 20.9 Run type checking: npm run type-check --workspace frontend
- [ ] 20.10 Manual curl testing: register, login (verify profile in response), GET /users/me, PUT /users/me

## 21. Git & Final Commit

- [ ] 21.1 Review all changes: git diff
- [ ] 21.2 Stage changes: git add .
- [ ] 21.3 Create commit: git commit -m "feat(users): implement user service with profiles and preferences"
- [ ] 21.4 Verify commit: git log -1 --stat
- [ ] 21.5 Push to remote: git push

---

## Summary

**Total Tasks**: 77  
**Estimated Duration**: 3-4 days  
**Blockers**: PostgreSQL required for integration testing (tasks 20.x)  
**Prerequisites**: Change 3 (implement-authentication) ✅ complete, Alembic migrations working

**Task Breakdown**:
- Database: 7 tasks
- Backend Models: 5 tasks  
- Backend Validation: 6 tasks
- Backend Routes: 36 tasks
- Frontend: 16 tasks
- Documentation: 8 tasks
- Integration & Verification: 10 tasks
- Git: 5 tasks
