## Context

Food Store is a new e-commerce platform being built from scratch. The backend will be FastAPI (Python), the frontend will be React, and both need a shared monorepo structure. All future development depends on getting this foundation right. The team needs a clear directory structure, consistent development tools, and automated quality checks from day one.

## Goals / Non-Goals

**Goals:**
- Establish a scalable monorepo structure that separates backend, frontend, shared code, and configuration
- Set up automated quality gates: linting, code formatting, testing frameworks
- Create a reproducible local development environment (one command to start)
- Define commit conventions and code review standards
- Build a CI/CD pipeline skeleton ready for integration

**Non-Goals:**
- Deploy to production (infrastructure setup comes later)
- Build complete authentication or business logic (those are separate changes)
- Configure external services like databases or payment processors (Phase 2+)

## Decisions

**D1: Monorepo structure using npm workspaces**
- **Choice**: Use npm workspaces in a single git repo with `packages/` directories
- **Why**: Allows shared code between frontend and backend, unified CI/CD, single source of truth for versions
- **Alternatives considered**:
  - Separate repos: More decoupled but harder to share code and maintain consistency
  - Yarn workspaces: Functionally similar, but npm is more standard and simpler setup
- **Trade-off**: Requires careful dependency management to avoid circular references

**D2: Python FastAPI backend, React frontend**
- **Choice**: FastAPI for REST API (async, fast, great for modern Python), React for frontend (industry standard)
- **Why**: FastAPI is performant and well-designed; React is mature and has massive ecosystem
- **Alternatives**: Django (slower), Flask (less modern), GraphQL (overkill for Phase 1)
- **Trade-off**: Two language ecosystems to maintain; will need careful API design

**D3: Git hooks + Husky for local quality checks**
- **Choice**: Husky for pre-commit hooks (linting, formatting) before code reaches CI
- **Why**: Catches issues locally, faster feedback, reduces CI failures
- **Alternatives**: Skip hooks (risky, inconsistent code) or GitHub branch protection only (slower feedback)
- **Trade-off**: Slightly slower commits if code isn't formatted; users can skip but shouldn't

**D4: GitHub Actions for CI/CD**
- **Choice**: Use GitHub Actions for all automation (already integrated with repo)
- **Why**: Free, integrated, no external vendor lock-in
- **Alternatives**: GitLab CI, Jenkins (overkill), CircleCI (vendor lock-in)
- **Trade-off**: Builds in GitHub; less flexible than self-hosted CI but much simpler

**D5: ESLint + Prettier for frontend, Black + Ruff for backend**
- **Choice**: Industry-standard formatters and linters for each language
- **Why**: Enforces consistency, catches bugs early, minimal configuration
- **Trade-off**: One more dependency per language, but ROI is massive

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Monorepo becomes too large | Clear package boundaries from day one; periodic audits for circular dependencies |
| Frontend and backend versions drift | Lock shared code versions in package.json; automate updates |
| Developers skip git hooks | Make hooks helpful, not annoying; educate team on why they exist |
| CI becomes a bottleneck | Start with fast checks; move slow tests to nightly runs later |
| Python and JavaScript tooling conflicts | Separate package managers; Python in `/backend`, Node in root with `packages/` |

## Migration Plan

1. Create directory structure locally
2. Initialize git repo with initial commit
3. Set up npm workspaces and first package.json
4. Configure Python backend with virtual env
5. Add git hooks (Husky, pre-commit)
6. Create GitHub Actions workflows
7. Document setup process in README
8. Create initial contributing guidelines

## Open Questions

- Should we use TypeScript on frontend? (Yes, recommended for large projects)
- Should we use Pydantic v2 for backend? (Yes, latest best practice)
- What's the monorepo package naming convention? (suggest `@foodstore/core`, `@foodstore/ui`)
- Do we need Docker from day one? (Nice-to-have for Phase 2 deployment)
