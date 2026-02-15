# Work In Progress - ChatBot Application Starter

## Current Status

**In progress** — Subscribers page renamed from Inbox (URL `/subscribers`); E2E and unit tests for subscribers added. Some existing frontend tests may be failing (use-chat-stream, chat-flow integration).

## Recent Changes

### 2026-02-15 (Latest) - Subscribers rename & test coverage

- **Inbox → Subscribers**
  - ✅ URL: `/dashboard/apps/[id]/inbox` → `/dashboard/apps/[id]/subscribers`
  - ✅ i18n: `INBOX_*` keys replaced with `SUBSCRIBERS_*` in `frontend/i18n/keys.ts`
  - ✅ Components: `subscribers-container.tsx`, `subscribers-list.tsx`, `threads-list.tsx` use new keys
  - ✅ Edit app form: "Subscribers" nav link (Users icon) added next to "Try Chat"
  - ✅ Docs: `docs/subscribers-inbox.md` updated (Subscribers feature, navigation, testing)
- **E2E tests** for subscribers flow (fast feedback when things break)
  - ✅ Navigate to subscribers from edit app or direct URL
  - ✅ Three-panel layout and empty-state copy
- **Unit tests** for subscribers
  - ✅ `SubscribersContainer`: panels, selection, URL sync, placeholder copy
  - ✅ `SubscribersList`: empty state, search placeholder, loading, list + selection
  - ✅ `ThreadsList`: empty state, loading, list + selection
  - ✅ `subscribers-actions`: fetchSubscribers, fetchSubscriberThreads error paths

### 2026-02-15 (Evening) - Boyscout Rule & SSE refetch bug

- Boyscout rule in AGENTS.md; SSE message refetch fix in chat-container; E2E fixes; cleanup.

### 2026-02-15 (Late PM) - i18n & lint

- Full i18n (frontend/backend, error-key contract); lint/type fixes; E2E selector updates.

## Key Architecture Decisions

### i18n Error-Key Contract

Backend returns raw i18n keys in HTTP errors; frontend `translateError()` maps to English. See root `AGENTS.md`.

### i18n file locations

| File | Purpose |
|------|---------|
| `frontend/i18n/keys.ts` | All UI text + backend error key translations |
| `backend/app/i18n/keys.py` | Backend-internal strings only |

## Test Counts (after subscribers tests)

| Suite | Count (approx) |
|-------|-----------------|
| Backend (pytest) | 137 |
| Frontend (jest) | 176 + 19 subscriber tests |
| E2E (playwright) | 8 (6 chat + 2 subscribers) |
| **Total** | See `make test-backend` / `make test-frontend` / `make test-e2e` |

## Upcoming

- Fix any flaky or failing frontend unit tests (use-chat-stream, chat-flow integration) if still present.
- Optional: file attachments, message actions, markdown in messages, search, keyboard nav.
