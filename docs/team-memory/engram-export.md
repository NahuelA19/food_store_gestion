# Food Store Team Memory Export

**Exported**: 2026-05-07  
**Source**: Engram persistent memory (repositoriobasefoodstore-sdd)  
**Purpose**: Share accumulated project context and architectural decisions with the team

---

## Food Store OPSX Change Map (23 changes, 2-3 months)

- **Type**: architecture
- **Topic Key**: architecture/opsx-change-map-foodstore
- **Date**: 2026-04-25

**What**: Complete mapping of 23 OPSX changes for Food Store development from scratch to production, organized in 6 phases with explicit dependencies.

**Why**: To provide a clear, sequenced roadmap for the entire e-commerce platform development using OPSX workflow. Prevents dead-end decisions and ensures dependencies are respected.

**Where**: 
- Phase 0 (3 changes): Infrastructure foundation
- Phase 1 (3 changes): Authentication & RBAC
- Phase 2 (3 changes): Catalog & Products
- Phase 3 (3 changes): Client features (addresses, cart, navigation)
- Phase 4 (5 changes): Orders, Payments, FSM (critical business logic)
- Phase 5 (3 changes): Admin dashboards & configuration
- Phase 6 (3 changes): Testing, Deployment, Documentation

**Learned**: 
- Order creation (UoW) is the architectural pivot point; everything after requires it
- Payment integration depends on orders; must not be done in parallel
- Cart is 100% client-side (Zustand + localStorage), independent of backend until checkout
- FSM state machine is COMPLEX; plan 3 days and follow strict design before coding
- Parallel work possible: infrastructure + error-handling, categories + ingredients, shopping-cart + navigation-layout
- Total estimation: 45-57 days (2-3 months) with 1-2 devs, 40-50% parallelizable with 3+ devs

**Key dependencies (non-negotiable)**:
1. infrastructure-setup → everything
2. database-domain-models → everything data-related
3. authentication-system → all client-facing features
4. products-catalog → cart, order creation
5. order-creation-uow-atomic → payments, FSM
6. payment-mercadopago-integration → FSM state transitions

---

## OPSX: setup-project-structure completed (56/65 tasks)

- **Type**: architecture
- **Topic Key**: opsx/setup-project-structure
- **Date**: 2026-04-26

**What**: Completed setup-project-structure change with 56 of 65 tasks done. Established complete monorepo foundation with React frontend, FastAPI backend, CI/CD pipelines, dev tools, testing setup, documentation, and initial git commit.

**Why**: Food Store project needed foundational infrastructure for e-commerce development. This change establishes structure, conventions, tooling, and automation that all 22 subsequent changes depend on.

**Where**: 
- Root: .gitignore, package.json, .eslintrc.json, .prettierrc.json, commitlint.config.js, .editorconfig
- Backend: backend/app/, backend/tests/, backend/requirements.txt, backend/pyproject.toml, backend/pytest.ini
- Frontend: frontend/src/, frontend/public/, frontend/package.json, frontend/tsconfig.json, frontend/vitest.config.ts
- CI/CD: .github/workflows/ (lint.yml, test.yml, build.yml, security.yml)
- Git Hooks: .husky/ (pre-commit, commit-msg)
- Documentation: README.md, GETTING-STARTED.md, docs/SETUP.md, docs/ARCHITECTURE.md, docs/CONTRIBUTING.md, docs/CHANGES.md, docs/API.md, docs/guides/

**Learned**: 
- npm workspaces + Python monorepo works well with separate package managers
- Husky hooks must validate both frontend (ESLint/Prettier) and backend (Ruff/Black) code
- Test setup requires multiple dependencies (pytest, pytest-asyncio, httpx, pytest-cov, @testing-library packages)
- Vite needs index.html at workspace root, not in public/
- Pre-commit hooks validate commit messages with commitlint (requires @commitlint/config-conventional)
- Full workflow: code → git add → pre-commit hooks (lint/format) → commit-msg validation → push → GitHub Actions

---

## OPSX: setup-project-structure todas las 65 tareas completadas

- **Type**: architecture
- **Topic Key**: opsx/setup-project-structure/apply
- **Date**: 2026-04-26

**What**: Completadas las 2 tareas finales de verificación (10.3 y 10.4), alcanzando 65/65 tareas del apply en setup-project-structure.

**Why**: Necesitábamos terminar la implementación de la infraestructura base del proyecto Food Store e-commerce.

**Where**: openspec/changes/setup-project-structure/tasks.md (actualizado con checkmarks), git commit a9ee067

**Learned**: 
- GitHub Actions workflows (lint, test, build, security) están correctamente configurados con triggers en pull_request
- ESLint detecta correctamente violaciones de linting (variables no usadas, imports innecesarios, etc.)
- La cadena de pre-commit hooks funciona como se espera antes de cada commit
- El proyecto ahora tiene una base sólida: monorepo con React+TypeScript frontend, FastAPI backend, CI/CD completo, documentación, testing setup

---

## OPSX: docs/CHANGES.md actualizado - Change 1 complete

- **Type**: decision
- **Topic Key**: opsx/docs-changes-sync
- **Date**: 2026-04-27

**What**: Actualizado docs/CHANGES.md para reflejar que setup-project-structure está completado (65/65 tasks, archived).

**Why**: Mantener la documentación sincronizada con el estado real del proyecto y el roadmap OPSX.

**Where**: docs/CHANGES.md (actualizado: Change 1 status, Phase 1 overview, Timeline & Milestones, Next Steps), commit 03bc70e

**Learned**: Importante actualizar docs/CHANGES.md como parte del archive workflow — sirve como fuente de verdad para stakeholders sobre el estado general del proyecto.

---

## How to Import These Memories

If you're a team member receiving this export:

1. **Pull the file** from GitHub:
   ```bash
   git pull
   ```

2. **Tell the agent to import**:
   > "Import the team memories from `docs/team-memory/engram-export.md`"

3. **The agent will**:
   - Read each `##` section
   - Call `mem_save` for each entry
   - Skip duplicates automatically

---

**Maintained by**: OPSX Orchestrator  
**Next export**: After each completed OPSX change
