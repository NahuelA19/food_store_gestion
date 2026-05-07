# 🍕 Food Store — Team Memory Export (Engram)

> Exportación de memorias persistentes del proyecto para sincronización entre desarrolladores.
> Última actualización: 2026-05-07

---

## Food Store OPSX Change Map (23 changes, 2-3 months)

- **Type**: architecture
- **Topic Key**: architecture/opsx-change-map
- **Date**: 2026-04-25

**What**: Complete mapping of 23 OPSX changes for Food Store development from scratch to production, organized in 6 phases with explicit dependencies.

**Why**: To provide a clear, sequenced roadmap for the entire e-commerce platform development using OPSX workflow. Prevents dead-end decisions and enables parallel work where possible.

**Where**: 
- `docs/CHANGES.md` — Complete mapa of 23 changes with dependencies
- `README.md` — Execution order guide

**Learned**: 
- **Order creation (order-creation-uow-atomic) is the architectural pivot**: everything after depends on it; must be designed perfectly before implementation
- **FSM (order-fsm-state-machine) is complex**: 6 states, strict transitions, atomic stock management; plan 3 days minimum
- **Cart is 100% client-side**: Zustand + localStorage, completely independent from backend until checkout — no backend changes needed
- **Payment integration has strict dependency chain**: webhooks must happen after orders are created
- **Parallel opportunities**: infrastructure + error-handling, categories + ingredients, shopping-cart + navigation-layout (40-50% of work)
- **Total project estimation**: 45-57 days with 1-2 devs (sequential), 30-40 days with 3+ devs (parallel where possible)

---

## OPSX: setup-project-structure completed (56/65 tasks)

- **Type**: architecture
- **Topic Key**: opsx/setup-project-structure
- **Date**: 2026-04-26

**What**: Completed setup-project-structure change with 56 of 65 tasks done. Established complete monorepo foundation with React frontend, FastAPI backend, CI/CD pipelines, dev tools, testing setup, documentation, and initial git commit.

**Why**: Food Store project needed foundational infrastructure for e-commerce development. This change establishes structure, conventions, tooling, and automation that all 22 subsequent changes depend on.

**Where**: 
- Root: `.gitignore`, `package.json`, `.eslintrc.json`, `.prettierrc.json`, `commitlint.config.js`, `.editorconfig`
- Backend: `backend/app/`, `backend/tests/`, `backend/requirements.txt`, `backend/pyproject.toml`, `backend/pytest.ini`
- Frontend: `frontend/src/`, `frontend/public/`, `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vitest.config.ts`
- CI/CD: `.github/workflows/` (lint.yml, test.yml, build.yml, security.yml)
- Git Hooks: `.husky/` (pre-commit, commit-msg)
- Documentation: `README.md`, `GETTING-STARTED.md`, `docs/SETUP.md`, `docs/ARCHITECTURE.md`, `docs/CONTRIBUTING.md`, `docs/CHANGES.md`, `docs/API.md`, `docs/guides/`

**Learned**: 
- npm workspaces + Python monorepo works well with separate package managers
- Husky hooks must validate both frontend (ESLint/Prettier) and backend (Ruff/Black) code
- Test setup requires multiple dependencies (pytest, pytest-asyncio, httpx, pytest-cov, @testing-library packages)
- Vite needs `index.html` at workspace root, not in public/
- Pre-commit hooks validate commit messages with commitlint (requires @commitlint/config-conventional)
- Full workflow: code → git add → pre-commit hooks (lint/format) → commit-msg validation → push → GitHub Actions

---

## OPSX: setup-project-structure todas las 65 tareas completadas

- **Type**: architecture
- **Topic Key**: opsx/setup-project-structure/apply
- **Date**: 2026-04-26

**What**: Completadas las 2 tareas finales de verificación (10.3 y 10.4), alcanzando 65/65 tareas del apply en setup-project-structure.

**Why**: Necesitábamos terminar la implementación de la infraestructura base del proyecto Food Store e-commerce.

**Where**: 
- `openspec/changes/setup-project-structure/tasks.md` (actualizado con checkmarks)
- Git commit: a9ee067

**Learned**: 
- GitHub Actions workflows (lint, test, build, security) están correctamente configurados con triggers en `pull_request`
- ESLint detecta correctamente violaciones de linting (variables no usadas, imports innecesarios, etc.)
- La cadena de pre-commit hooks funciona como se espera antes de cada commit
- El proyecto ahora tiene una base sólida: monorepo con React+TypeScript frontend, FastAPI backend, CI/CD completo, documentación, testing setup

---

## OPSX: docs/CHANGES.md actualizado - Change 1 complete

- **Type**: decision
- **Topic Key**: decision/docs-changes-sync
- **Date**: 2026-04-27

**What**: Actualizado `docs/CHANGES.md` para reflejar que `setup-project-structure` está completado (65/65 tasks, archived).

**Why**: Mantener la documentación sincronizada con el estado real del proyecto y el roadmap OPSX.

**Where**: 
- `docs/CHANGES.md` (actualizado: Change 1 status, Phase 1 overview, Timeline & Milestones, Next Steps)
- Git commit: 03bc70e

**Learned**: Importante actualizar `docs/CHANGES.md` como parte del archive workflow — sirve como fuente de verdad para stakeholders sobre el estado general del proyecto.

---

## Session Context: OPSX Workflow

- **Proyecto**: Food Store e-commerce (React 18 + FastAPI)
- **Workflow**: OPSX (Fluid specification-driven development)
- **Estado**: Change 1 (setup-project-structure) completado y archivado; listo para Change 2
- **Próximas Changes**: infrastructure-setup, global-error-handling, add-database-layer, auth-backend, products-catalog, etc.
- **Team Workflow**: 
  - Usar OPSX para crear changes atomizadas (horas a días, no semanas)
  - Siempre actualizar `docs/CHANGES.md` después de archivar
  - Mantener sincronización entre estado OPSX y documentación

---

## How to Import This Memory

Para importar estas memorias en tu máquina, ejecuta:

```bash
git pull  # Obtén este archivo
# Luego pide al agente: "importa las memorias de equipo desde docs/team-memory/engram-export.md"
```

El agente creará automáticamente las observaciones en tu Engram persistente sin duplicados.

---

*Exportado por: Orchestrator | Proyecto: repositoriobasefoodstore-sdd | Scope: project*
