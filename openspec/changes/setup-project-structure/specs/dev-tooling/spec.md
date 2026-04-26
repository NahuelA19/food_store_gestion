## ADDED Requirements

### Requirement: Git hooks with Husky
The project SHALL use Husky to manage git hooks that run automated checks before commits. Hooks MUST be easy to install and understand by all developers.

#### Scenario: Pre-commit hook runs linting
- **WHEN** developer commits code
- **THEN** pre-commit hook runs linting and formatting checks before commit is allowed

#### Scenario: Hooks bypass with caution
- **WHEN** developer needs to bypass hooks
- **THEN** they can use `git commit --no-verify` with explicit knowledge of why

### Requirement: Frontend linting and formatting
The frontend project SHALL use ESLint for linting and Prettier for code formatting. Configuration MUST enforce consistent code style across all frontend code.

#### Scenario: ESLint rules enforced
- **WHEN** developer writes code that violates ESLint rules
- **THEN** linting fails and error messages guide corrections

#### Scenario: Prettier formats code
- **WHEN** `npm run format` is executed in frontend package
- **THEN** all code is reformatted to match project standards

### Requirement: Backend linting and formatting
The backend project SHALL use Black for code formatting and Ruff for linting. Configuration MUST enforce consistent Python code style.

#### Scenario: Black formats Python code
- **WHEN** `black .` is run in backend directory
- **THEN** all Python files are reformatted to Black standards

#### Scenario: Ruff checks for code issues
- **WHEN** `ruff check .` is run in backend directory
- **THEN** code quality issues and violations are reported

### Requirement: Commit message standards
Commit messages SHALL follow Conventional Commits format. A commitlint hook MUST validate commit messages before they are saved to history.

#### Scenario: Valid commit message
- **WHEN** developer commits with message like "feat: add user registration"
- **THEN** commit is accepted and hook passes

#### Scenario: Invalid commit message rejected
- **WHEN** developer tries to commit with non-compliant message
- **THEN** commitlint hook prevents the commit and shows correct format

### Requirement: Development scripts
The project SHALL provide convenient npm scripts for common development tasks. Scripts MUST be consistent across both frontend and backend where applicable.

#### Scenario: Standard scripts exist
- **WHEN** developer runs `npm run --list`
- **THEN** output shows: `dev`, `build`, `test`, `lint`, `format`, `clean`

#### Scenario: Scripts are functional
- **WHEN** developer runs `npm run lint` from root
- **THEN** linting runs across both frontend and backend

### Requirement: Environment variable management
The project SHALL use `.env.example` files to document required environment variables. Actual `.env` files MUST be in `.gitignore` for security.

#### Scenario: Example environment file exists
- **WHEN** developer examines backend and frontend directories
- **THEN** each contains a `.env.example` file with documented variables

#### Scenario: Environment variables protected
- **WHEN** developer runs `git status`
- **THEN** `.env` files are not shown as untracked (they're in .gitignore)
