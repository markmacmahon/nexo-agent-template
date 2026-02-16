# Work In Progress - Nexo Agent Template

## Current Status

**Stable** - Foundation runtime with webhook routing, SSE streaming, conversation threading, Partner API, and dashboard for managing agents.

## Recent Changes (Last 1-2 Weeks)

### 2026-02-16 - Incubator folder for experimental code

- Created `incubator/` for experimental scripts, tools, and Claude Code skills
- Lower standards than core (documentation required, tests optional)
- Comprehensive README with templates and graduation path

### 2026-02-16 - Scalable test data pattern

- Standardized credentials: `@nexo.xyz` domain, `NexoPass#99` password
- Persona pattern: `{persona}@nexo.xyz` for easy expansion
- `make seed` creates test data idempotently

### 2026-02-16 - Fresh setup verification and fixes

- Docker naming: `name: nexo` in docker-compose.yml
- Migration fix: duplicate customer_id column conflict resolved
- Documentation: added Playwright browsers and seed steps

### 2026-02-16 - Partner API (App ID + Secret)

- Routes accept X-App-Id + X-App-Secret for no-login API access
- Create/edit app UI shows App ID & Secret section when webhook mode
- Partner API documentation on edit page

### 2026-02-15 - Dashboard and apps table

- Dedicated app page at `/dashboard/apps/[id]`
- Apps table with Chat/Subscribers icon links and actions dropdown
- Dashboard landing page with Go to Apps CTA

## Key Architecture Decisions

### i18n Error-Key Contract

Backend returns raw i18n keys in HTTP errors; frontend `translateError()` maps to English.

### Database Connection Pooling

Two strategies via `DATABASE_POOL_CLASS`:
- `"null"` (default) - No pooling, serverless-friendly
- `"queue"` - Connection pool for traditional servers

## Test Counts

| Suite | Count |
|-------|-------|
| Backend (pytest) | 154 |
| Frontend (jest) | 178 |
| E2E (playwright) | 15 |
| Example smoke tests | 4 |

---

## Next Up

### Runtime Context Injection

**Goal:** Provide user profile, preferences, and shared memory to agents at runtime.

**What needs discussion:**
- Which state should be injected? (user profile, shared memory, conversation context)
- Permission model (what can each agent read/write?)
- State storage approach (JSONB? separate tables? key-value?)
- Write-back mechanism (how do agents update state?)

**See:** `docs/system-overview.md` lines 72-218 for existing vision/architecture diagrams.

### Projects/Teams & Admin

**Goal:** Enable team collaboration and platform administration.

**What needs discussion:**
- Project/workspace model
- Role-based permissions (owner, admin, editor, viewer?)
- Admin capabilities needed
- Migration strategy for existing users

---

## Backlog (Lower Priority)

- File attachments in messages
- Message actions (edit, delete, reactions)
- Markdown rendering in chat
- Search across conversations
- Keyboard navigation shortcuts

---

## Notes for Next Session

(Use this section to capture context when ending a session)

- Last commit: [will be filled in when needed]
- Active branches: main
- Blocked on: [nothing currently]
- Pending decisions: [will be filled in when needed]
