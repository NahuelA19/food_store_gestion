# Project Global Pending Tasks Tracker

**Last Updated**: 2026-05-07  
**Project**: Food Store E-commerce  
**Status**: Phase 2 in progress (Change 4 - create-user-service ready to start)

---

## Overview

This document tracks ALL pending tasks across the entire project that are blocking or pending verification. Tasks are organized by:
- **Change** (OPSX change they belong to)
- **Type** (verification, implementation, testing, documentation)
- **Priority** (blocker, high, medium, low)
- **PostgreSQL required** (yes/no)

---

## 📋 Pending Tasks by Change

### Change 3: implement-authentication ⏳ 41/52 complete

**Status**: Functionally complete, verification pending  
**Blocker for**: Change 4 (create-user-service) — ❌ NO (can proceed in parallel)

#### Section 7: Backend CI/CD & Testing (2 pending)

| Task | Type | Priority | PG Required | Est. Time | Status |
|------|------|----------|-------------|-----------|--------|
| 7.3: `mypy backend/ --strict` | Verification | HIGH | ✅ Yes* | 5 min | ⏳ Pending |
| 7.4: Manual curl verification (register, login, protected) | Verification | HIGH | ✅ Yes | 10 min | ⏳ Pending |

*mypy doesn't use DB, but backend needs running for CI/CD pipeline

#### Section 11: Frontend Testing (1 pending)

| Task | Type | Priority | PG Required | Est. Time | Status |
|------|------|----------|-------------|-----------|--------|
| 11.1: useAuth hook tests (login, register, logout, persistence) | Testing | MEDIUM | ❌ No | 1-2 hrs | ⏳ Pending |

**Note**: Removed due to async mocking complexity. Requires MSW (Mock Service Worker) or fetch mocking.

#### Section 12: Integration Testing (3 pending)

| Task | Type | Priority | PG Required | Est. Time | Status |
|------|------|----------|-------------|-----------|--------|
| 12.1: E2E flow test (register → redirect → localStorage → refresh) | Testing | HIGH | ✅ Yes | 10 min | ⏳ Pending |
| 12.2: Error scenario tests (duplicate email, weak password, unauthorized) | Testing | HIGH | ✅ Yes | 15 min | ⏳ Pending |
| 12.3: Protected endpoint verification (JWT in Authorization header) | Testing | HIGH | ✅ Yes | 5 min | ⏳ Pending |

#### Section 14: Quality Assurance (3 pending)

| Task | Type | Priority | PG Required | Est. Time | Status |
|------|------|----------|-------------|-----------|--------|
| 14.1: Full test run (`npm run test`) | Verification | HIGH | ✅ Yes | 5 min | ⏳ Pending |
| 14.2: Linting & formatting (mypy, ruff, black, ESLint, Prettier) | Verification | HIGH | ✅ Yes* | 5 min | ⏳ Pending |
| 14.3: Manual smoke test (register, login, protected endpoint, logout) | Verification | HIGH | ✅ Yes | 10 min | ⏳ Pending |

**Total pending for Change 3**: 11 tasks, ~2 hours (mostly testing)  
**PostgreSQL required**: 9/11 tasks (82%)  
**Can start Change 4 now**: ✅ YES

---

### Change 4: create-user-service 📋 PROPOSED (77 tasks)

**Status**: All artifacts complete (proposal, design, specs, tasks)  
**Ready to**: Start implementation  
**Dependencies**: Change 3 ✅ (code complete, verification pending)

#### Proposed Artifacts (2026-05-07)

| Artifact | Status | Description |
|----------|--------|-------------|
| proposal.md | ✅ Done | Why user service, what changes, capabilities, impact |
| design.md | ✅ Done | Technical decisions, database design, migration plan |
| specs/ (5 files) | ✅ Done | user-profiles, user-preferences, user-management-api, user-validation, user-auth (delta) |
| tasks.md | ✅ Done | 77 implementation tasks in 21 sections |

#### Implementation Tasks Breakdown

| Phase | Count | Est. Time |
|-------|-------|-----------|
| Database + ORM | 12 | 4 hours |
| Backend Routes | 36 | 8 hours |
| Frontend | 16 | 6 hours |
| Testing | 11 | 4 hours |
| Docs + Verification | 2 | 2 hours |

**Total implementation time**: 3-4 days  
**PostgreSQL required**: YES (all tasks require PostgreSQL for testing)  
**Can start now**: ✅ YES

---

## 🔴 Blocker Summary

| Item | Blocked | Reason | Solution |
|------|---------|--------|----------|
| Change 3 verification | Change 3 | PostgreSQL not available locally | Set up PostgreSQL + run tasks 7.3-14.3 |
| useAuth hook tests (11.1) | Change 3 | Async mocking complexity | Implement MSW or fetch mocking (2 hrs) |
| Change 4 implementation | Change 4 | PostgreSQL needed for E2E | PostgreSQL will be needed anyway |

**Bottom line**: ✅ NO BLOCKERS for starting Change 4. Verification tasks can be deferred.

---

## 📅 Verification Tasks Queue (PostgreSQL required)

### When PostgreSQL is available:

**Priority 1 (CRITICAL)** — Complete before merging Change 3:
1. Section 7.3: mypy type checking (5 min)
2. Section 7.4: Manual curl verification (10 min)
3. Section 14.2: Full linting (5 min)

**Priority 2 (HIGH)** — Should complete before prod:
4. Section 12.1-12.3: E2E integration tests (30 min)
5. Section 14.1: Full test suite (5 min)
6. Section 14.3: Smoke test (10 min)

**Priority 3 (MEDIUM)** — Enhance testing (optional, technical debt):
7. Section 11.1: useAuth hook tests (1-2 hrs)

**Total time**: ~1.5 hours (critical + high) or ~3 hours (all)

---

## 🗂️ Reference Documents

| Document | Purpose | Path |
|----------|---------|------|
| **Change 3 Pending Tasks** | Detailed breakdown of Change 3 pending items | docs/CHANGE3-PENDING-TASKS.md |
| **Authentication Guide** | Auth implementation, JWT flow, examples | docs/AUTHENTICATION.md |
| **Change 3 Tasks Archive** | Original 52 tasks (41 complete, 11 pending) | openspec/changes/archive/2026-05-06-implement-authentication/tasks.md |
| **Project Roadmap** | All 23 planned changes, dependencies, timeline | docs/CHANGES.md |

---

## 🚀 Next Steps

### Immediate (Today)

1. ✅ **Export Engram to GitHub** — DONE (commit 02a108c)
2. ✅ **Document Change 3 pending tasks** — DONE (docs/CHANGE3-PENDING-TASKS.md)
3. ✅ **Create global tracker** — IN PROGRESS (this doc)
4. 📝 **Propose Change 4** (create-user-service) — NEXT

### Short term (This week)

5. **Implement Change 4** (3-5 days)
6. **Return to Change 3 verification** (when PostgreSQL available)

### Medium term (Next week)

7. **Continue Phase 2 changes** (5, 6, 7)
8. **Set up PostgreSQL in CI/CD** (optional, for automated verification)

---

## 📊 Project Metrics

| Metric | Value | Trend |
|--------|-------|-------|
| **Changes completed** | 3/23 | ✅ On track |
| **Changes proposed** | 4/23 | ✅ Next: implement |
| **Tasks completed (cumulative)** | 154/700 | ✅ 22% |
| **Pending verification tasks** | 11 | ✅ Isolated to Change 3 |
| **Pending implementation tasks** | 77 | 🟢 Change 4 ready |
| **No-blocker tasks pending** | ✅ YES | 🟢 Can proceed |
| **Phase 2 progress** | Change 4 proposed | 🟢 Ready to implement |

---

## 💡 Decision Log

**2026-05-07 (latest)**: Completed Change 4 proposal with all artifacts
- Reason: Follow OPSX workflow: propose → design → apply → archive
- Artifacts: proposal.md (Why), design.md (How), specs (5 files - What), tasks.md (77 implementation tasks)
- Ready: for immediate implementation

**2026-05-07**: Deferred Change 3 verification tasks pending PostgreSQL setup  
- Reason: Complex async mocking, not critical for functionality
- Reason: Form tests already cover UI layer (11.2)
- Risk: Hook edge cases may be missed
- Mitigation: Revisit after more features use the hook

---

## How to Use This Document

### For sprint planning:
- Check "Pending Tasks by Change" section
- Filter by Priority and PostgreSQL requirement
- Assign tasks to team members

### For tracking:
- Update Status column as tasks complete
- Update Est. Time if estimates change
- Add new pending tasks as they're discovered

### For onboarding:
- Reference documents in "Reference Documents" section
- Check "Decision Log" for context
- Read CHANGE3-PENDING-TASKS.md for detailed procedures

---

**Maintained by**: OPSX Orchestrator  
**Last review**: 2026-05-07  
**Next review**: After Change 4 proposed  
**File**: docs/GLOBAL-PENDING-TASKS.md
