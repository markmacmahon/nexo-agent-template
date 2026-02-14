# ChatBot Application Starter - Developer Guide

This document is the **single source of truth** for AI assistants and developers working with this codebase. Tool-specific files (`CLAUDE.md`, `.cursor/rules/`) are thin pointers back to this file.

See also `backend/AGENTS.md` and `frontend/AGENTS.md` for subproject-specific guidance.

## Mission

Evolve this monorepo with **TDD first**, **high craftsmanship**, and **clean modular design**. Every change follows red-green-refactor. No exceptions.

## Non-Negotiables

1. **Tests first** -- always start with a failing test.
2. **Small steps only** -- one behavior at a time.
3. **No speculative abstractions.**
4. **Prefer composition over inheritance.**
5. **No duplication without intent.**
6. **One idiomatic way to do things** -- if multiple approaches exist, choose the simplest consistent one.

## TDD Workflow (Strict)

Every feature, fix, or refactor follows this cycle:

| Phase | What to do |
|-------|-----------|
| **RED** | Write the smallest failing test describing the desired behavior. |
| **GREEN** | Implement the simplest code that makes it pass. |
| **REFACTOR** | Improve naming, structure, cohesion. Remove duplication. Tests stay green. |

No feature work without this cycle.

**Definition of done:**
- Tests added/updated and all passing
- Lint + format clean (`make precommit`)
- No dead/debug code
- Types correct (Python + TypeScript strict)

## Architecture Principles

- **I/O at the edges** -- API routes, DB, network calls stay in thin boundary layers.
- **Core logic pure and testable** -- no hidden globals, explicit dependencies.
- **Small cohesive modules** -- clear naming over clever abstractions.
- **Minimal cross-boundary coupling** -- backend and frontend share only the OpenAPI contract.

## How AI Agents Should Work Here

When implementing changes:

1. Propose the smallest failing test.
2. Implement minimal passing code.
3. Refactor for clarity and modularity.
4. Summarize changes briefly (why + impact).

If unclear, assume the simplest interpretation and proceed test-first.

**Avoid:** large rewrites, over-engineering, adding frameworks without need.

## AI Agent Configuration

This project supports multiple AI coding agents via the `AGENTS.md` convention:

| Tool | How it finds instructions |
|------|--------------------------|
| **Codex** | Reads `AGENTS.md` natively |
| **Gemini** | Reads `AGENTS.md` natively |
| **Claude Code** | Reads `CLAUDE.md` → points here |
| **Cursor** | Reads `.cursor/rules/project.mdc` → points here |

**To update AI instructions, edit only this file** (and the subproject `AGENTS.md` files). The pointer files should rarely change.

## Project Structure

```
agent-template/
├── AGENTS.md                         # AI instructions - single source of truth
├── CLAUDE.md                         # Pointer → AGENTS.md (for Claude Code)
├── .cursor/rules/project.mdc        # Pointer → AGENTS.md (for Cursor)
├── Makefile                          # Single operational interface (run from root)
├── backend/                          # Python FastAPI backend (see backend/AGENTS.md)
├── frontend/                         # Next.js React frontend (see frontend/AGENTS.md)
└── docker-compose.yml               # Docker services configuration
```

## Makefile -- Single Operational Interface

**IMPORTANT**: Always run `make` commands from the **project root**, never from subdirectories.

The Makefile is the single entrypoint for common tasks. If something is rarely used, it should not become a Make target.

```bash
# Development
make start-backend              # FastAPI on :8000
make start-frontend             # Next.js on :3000

# Testing
make test-backend               # pytest (starts test DB automatically)
make test-frontend              # Jest via pnpm

# Quality
make precommit                  # Lint + format + type check (all files)
make install-hooks              # One-time: install git pre-commit hooks

# Database
docker compose up -d db         # Start PostgreSQL
make docker-migrate-db          # Run Alembic migrations
```

## Type Safety

End-to-end type safety is maintained automatically:
1. Python types defined with Pydantic models (backend)
2. OpenAPI schema auto-generated from FastAPI
3. TypeScript types auto-generated from OpenAPI schema
4. Frontend uses typed API client for all backend calls

Never manually write API types -- they're auto-generated. After backend route changes, regenerate frontend types: `cd frontend && pnpm run generate-client`.

## Configuration Reference

### Database
- **Development:** `agents_db` on port 5432
- **Test:** `agents_test_db` on port 5433
- All names use the `agents_` prefix

### Environment Files
- Backend: `backend/.env` (requires 3 generated secret keys)
- Frontend: `frontend/.env.local`
- Both have `.env.example` templates

### Package Managers
- **Backend:** `uv` (not pip/poetry)
- **Frontend:** `pnpm` (not npm/yarn)

## Deployment

Both frontend and backend deploy to Vercel. Database hosted separately (e.g., Railway, Supabase).

## WIP.md

The `WIP.md` file tracks work-in-progress changes. Keep it focused on current development (last 1-2 weeks), not a complete changelog. Prune completed items regularly.

## Troubleshooting

**TypeScript errors after backend changes:** `cd frontend && rm -rf .next && pnpm run dev`

**Database connection issues:** `docker compose down && docker volume rm agent-template_postgres_data && docker compose up -d db && make docker-migrate-db`

**Dependency conflicts:** `cd backend && uv sync` or `cd frontend && pnpm install`
