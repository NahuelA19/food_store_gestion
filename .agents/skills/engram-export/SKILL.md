---
name: engram-export
description: >
  Exports Engram persistent memories to a shareable Markdown file so a team
  can commit it to GitHub and import it in other sessions.
  Trigger: When user says "export engram", "share memory", "export memories",
  "exportar engram", "compartir memoria", or "sync team memory".
license: Apache-2.0
metadata:
  author: food-store-team
  version: "1.0"
---

## When to Use

- A team member wants to share their Engram knowledge with the rest of the group
- Onboarding a new developer — export memories so they start with full context
- Archiving decisions before a major refactor
- Syncing knowledge between machines (e.g. home ↔ university lab)

---

## Critical Patterns

1. **Export = snapshot, not sync** — exporting creates a Markdown file you commit to Git. It is NOT a live two-way sync.
2. **Output file must be human-readable** — use Markdown so teammates can read it without any tool.
3. **Import = mem_save loop** — importing means reading the file and calling `mem_save` for each entry that does not already exist.
4. **Never overwrite** — always append / skip duplicates when importing. Engram's `mem_capture_passive` handles deduplication automatically.
5. **Scope this to the project** — always filter by `project` when searching so you don't export unrelated personal memories.

---

## Export Workflow

### Step 1 — Collect all project memories

```
mem_context(project: "<project-name>")
mem_search(query: "*", project: "<project-name>", limit: 20)
```

Repeat `mem_search` with different keywords if the project has many topics:
- `mem_search(query: "architecture")`
- `mem_search(query: "bugfix")`
- `mem_search(query: "decision")`
- `mem_search(query: "pattern")`

For each result, call `mem_get_observation(id)` to get the **full untruncated content**.

### Step 2 — Write the export file

Write to: `docs/team-memory/engram-export.md`

Use this exact structure per entry:

```markdown
## [TITLE]

- **Type**: decision | bugfix | architecture | pattern | config | discovery
- **Topic Key**: architecture/auth-model  _(omit if none)_
- **Date**: YYYY-MM-DD

**What**: …
**Why**: …
**Where**: …
**Learned**: …  _(omit if empty)_

---
```

### Step 3 — Commit the file

```bash
git add docs/team-memory/engram-export.md
git commit -m "docs(memory): export engram team memories"
git push
```

---

## Import Workflow (teammate side)

### Step 1 — Pull the file

```bash
git pull
```

### Step 2 — Let the agent import it

Tell the agent:

> "Import the team memories from `docs/team-memory/engram-export.md`"

The agent will:
1. Read the file
2. For each `##` section, call `mem_save` with the corresponding fields
3. Skip entries that are already in memory (Engram deduplicates automatically)

---

## File Location Convention

| Purpose | Path |
|---------|------|
| Shared team export | `docs/team-memory/engram-export.md` |
| Per-developer snapshot | `docs/team-memory/engram-<github-user>.md` |
| Archived snapshot | `docs/team-memory/archive/YYYY-MM-DD-export.md` |

---

## Commands

```bash
# Export (agent does this, but you can trigger manually)
# Tell the agent: "export engram to docs/team-memory/engram-export.md"

# Commit and push
git add docs/team-memory/
git commit -m "docs(memory): export engram team memories"
git push

# Import on another machine
git pull
# Tell the agent: "import team memories from docs/team-memory/engram-export.md"
```

---

## Example Export Entry

```markdown
## Switched products endpoint to async pagination

- **Type**: decision
- **Topic Key**: architecture/products-pagination
- **Date**: 2026-04-24

**What**: Changed `/api/products` to use cursor-based async pagination
**Why**: The previous offset query timed out with >500 rows
**Where**: backend/app/routes/products.py, backend/app/models/product.py
**Learned**: asyncpg does not support `.fetchmany()` — use `LIMIT/OFFSET` with explicit async fetch

---
```

---

## Resources

- Engram MCP tools: `mem_save`, `mem_search`, `mem_context`, `mem_get_observation`, `mem_capture_passive`
- Export target: `docs/team-memory/engram-export.md`
- See [assets/export-template.md](assets/export-template.md) for the blank template
