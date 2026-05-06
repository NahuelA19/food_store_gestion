## ADDED Requirements

### Requirement: User login form
The system SHALL provide a login form component where users can enter email and password. The form SHALL validate input, call the login API, and handle success/error responses.

#### Scenario: Successful login
- **WHEN** user fills login form with valid email and password, clicks "Login"
- **THEN** system calls `POST /api/auth/login`, receives JWT, stores token in localStorage, and redirects to home page

#### Scenario: Failed login displays error
- **WHEN** user fills login form with incorrect credentials, clicks "Login"
- **THEN** system displays error message "Invalid email or password" and remains on login page

#### Scenario: Network error handling
- **WHEN** user attempts login but API request fails (network error)
- **THEN** system displays error message "Network error, please try again" and allows retry

#### Scenario: Client-side validation before submit
- **WHEN** user submits login form with empty email or password
- **THEN** system displays validation error "Email and password are required" and does not call API

### Requirement: User registration form
The system SHALL provide a registration form component where users can enter email and password. The form SHALL validate input, call the registration API, and handle success/error responses.

#### Scenario: Successful registration
- **WHEN** user fills registration form with valid email and password (8+ chars), clicks "Register"
- **THEN** system calls `POST /api/auth/register`, receives JWT, stores token in localStorage, and redirects to home page

#### Scenario: Duplicate email rejected by backend
- **WHEN** user attempts registration with email already registered
- **THEN** system displays error message "Email already in use" and remains on registration page

#### Scenario: Weak password validation
- **WHEN** user fills registration form with password fewer than 8 characters
- **THEN** system displays validation error "Password must be at least 8 characters" and does not submit

#### Scenario: Email format validation
- **WHEN** user fills registration form with invalid email format (e.g., "notanemail")
- **THEN** system displays validation error "Invalid email format" and does not submit

### Requirement: JWT storage in localStorage
The system SHALL securely store JWT token in browser localStorage after successful login. The stored token SHALL be accessible for subsequent API requests.

#### Scenario: Token persists after login
- **WHEN** user logs in successfully
- **THEN** JWT is stored in localStorage under key "auth_token" and remains available on page refresh

#### Scenario: Token used in Authorization header
- **WHEN** authenticated user makes API request to protected endpoint
- **THEN** client attaches JWT from localStorage in Authorization header: `Authorization: Bearer <token>`

#### Scenario: Token deleted on logout
- **WHEN** user clicks logout
- **THEN** JWT is deleted from localStorage and subsequent requests lack authentication

### Requirement: Authentication context state
The system SHALL provide a React context that tracks current user authentication state and provides user information to all components. Context SHALL expose `isAuthenticated`, `user`, `login()`, `logout()`, and `register()` functions.

#### Scenario: Login updates context state
- **WHEN** user successfully logs in
- **THEN** auth context updates: `isAuthenticated=true`, `user={id, email}`, token stored

#### Scenario: Logout clears context state
- **WHEN** user clicks logout
- **THEN** auth context updates: `isAuthenticated=false`, `user=null`, token cleared from localStorage

#### Scenario: Auth state persists on page refresh
- **WHEN** authenticated user refreshes page
- **THEN** client reads token from localStorage, verifies token validity, restores auth context with user data

### Requirement: Navigation based on authentication state
The system SHALL conditionally render navigation links based on user authentication status. Authenticated users SHALL see "Profile" and "Logout" links; unauthenticated users SHALL see "Login" and "Register" links.

#### Scenario: Unauthenticated navigation
- **WHEN** user is not logged in
- **THEN** navigation bar displays "Login" and "Register" links, hides "Profile" and "Logout"

#### Scenario: Authenticated navigation
- **WHEN** user is logged in
- **THEN** navigation bar displays "Profile" and "Logout" links, hides "Login" and "Register"

### Requirement: Protected route redirection
The system SHALL prevent unauthenticated users from accessing protected pages. If unauthenticated user navigates to protected page, system SHALL redirect to login page.

#### Scenario: Unauthenticated access to protected page
- **WHEN** unauthenticated user navigates to `/profile` (protected page)
- **THEN** system redirects to `/login` page

#### Scenario: Authenticated access to protected page
- **WHEN** authenticated user navigates to `/profile` (protected page)
- **THEN** system renders profile page normally

### Requirement: Logout functionality
The system SHALL provide logout button in navigation. Clicking logout SHALL delete token from localStorage, clear auth context, and redirect user to home or login page.

#### Scenario: User logout
- **WHEN** authenticated user clicks "Logout" button
- **THEN** system clears token from localStorage, updates auth context to logged-out state, and redirects to login page
