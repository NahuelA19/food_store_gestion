# Food Store — Team Engram Memory Export

**Exported**: 2026-05-06 | **Project**: Food Store E-Commerce Platform

This file contains shared architectural decisions, discoveries, and implementation patterns from previous sessions. **Import by committing this file to GitHub and sharing with your team.**

---

## Food Store OPSX Change Map (23 changes, 2-3 months)

- **Type**: architecture
- **Topic Key**: architecture/food-store-change-map
- **Date**: 2026-04-25

**What**: Complete mapping of 23 OPSX changes for Food Store development from scratch to production, organized in 6 phases with explicit dependencies.

**Why**: To provide a clear, sequenced roadmap for the entire e-commerce platform development using OPSX workflow. Prevents dead-end decisions and ensures critical blockers are addressed first.

**Where**: `docs/CHANGES.md`, `README.md`, `openspec/` directory structure

**Learned**: 
- Order creation (order-creation-uow-atomic) is the architectural pivot—everything after depends on it; must be designed perfectly before implementation
- FSM (order-fsm-state-machine) is complex: 6 states, strict transitions, atomic stock management; plan 3 days minimum
- Cart is 100% client-side (Zustand + localStorage), completely independent from backend until checkout
- Payment integration has strict dependency chain: webhooks must happen after orders are created
- Parallel opportunities exist: infrastructure + error-handling, categories + ingredients, shopping-cart + navigation-layout (40-50% of work)
- Total project estimation: 45-57 days with 1-2 devs (sequential), 30-40 days with 3+ devs (parallel where possible)

---

## OPSX: setup-project-structure — First Change (65 tasks, complete)

- **Type**: architecture
- **Topic Key**: opsx/setup-project-structure/complete
- **Date**: 2026-04-27

**What**: Completed 65-task OPSX change establishing complete monorepo foundation with React frontend, FastAPI backend, CI/CD pipelines, dev tools, testing setup, documentation, and initial git commit.

**Why**: Food Store project needed foundational infrastructure before domain development could begin. This was the prerequisite for all subsequent changes.

**Where**: 
- `openspec/changes/setup-project-structure/` (proposal, design, tasks, specs)
- `openspec/changes/archive/2026-04-26-setup-project-structure/` (archived)
- `openspec/specs/` (4 synced specs: project-structure, dev-tooling, build-pipeline, project-documentation)

**Learned**:
- GitHub Actions workflows are correctly configured with triggers on `pull_request` events
- ESLint properly detects violations (unused variables, unnecessary imports, etc.)
- Pre-commit hooks work as expected before each commit
- Delta specs sync correctly from change-local to project-global specs
- Always update `docs/CHANGES.md` after archiving—it's the stakeholder-visible source of truth
- The project now has solid infrastructure: monorepo with React+TypeScript frontend, FastAPI backend, complete CI/CD, comprehensive documentation, full testing setup

---

## Food Store Architecture — OPSX Workflow Lessons

- **Type**: decision
- **Topic Key**: architecture/opsx-workflow
- **Date**: 2026-04-26

**What**: Established OPSX workflow conventions for Food Store: use kebab-case for change names, keep changes atomic (hours to days, not weeks), respect SDD layered architecture principles, follow propose → design → apply → archive cycle.

**Why**: To ensure all future changes follow a consistent, scalable development methodology. OPSX replaces the legacy SDD phase system with a fluid, CLI-driven workflow.

**Where**: `AGENTS.md` (project instructions), all OPSX changes in `openspec/changes/`

**Learned**:
- OPSX CLI is clean and dependency-aware: each artifact depends on previous ones
- Task checklist organization matters: breaking tasks into logical groups (10 groups for 65 tasks in setup-project-structure) improves clarity and tracking
- Rollback is straightforward: delete files/directories as needed if a change needs to restart
- The workflow is truly fluid—any action can run at any time without rigid phase locks

---

## Next Change: implement-authentication

- **Type**: discovery
- **Topic Key**: opsx/next-phase
- **Date**: 2026-05-06

**What**: The next active OPSX change is `implement-authentication` with 14 of 52 tasks completed (in-progress status).

**Why**: After establishing the project foundation, authentication is critical infrastructure for user management and access control across the e-commerce platform.

**Where**: `openspec/changes/implement-authentication/`

**Learned**: This change is currently in-progress and ready to continue in subsequent sessions.

---

## How to Import These Memories

If you are a **new team member** receiving this file:

1. Commit this file to your local repo: `git pull`
2. Read through all entries to understand decisions and patterns
3. For each entry, the agent will call `mem_save` to import into your Engram
4. Use `mem_search` to find relevant context when working on related tasks

If you are **resuming work on Food Store**:

1. Read the relevant section (e.g., "OPSX: setup-project-structure" if continuing that change)
2. Check the current status with `openspec list --json`
3. If starting a new change, reference the "Food Store OPSX Change Map" for dependencies

---

**Contact**: Ask the team if you have questions about any of these decisions or patterns.
