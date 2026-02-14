# Work In Progress - ChatBot Application Starter

## Recent Changes

### 2026-02-14

#### Test Suite Restructure
- Reorganized `__tests__/` from flat structure into typed subdirectories:
  - `actions/` -- server action tests (.ts)
  - `pages/` -- page component tests (.tsx)
  - `components/` -- reusable component tests (.tsx)
  - `lib/` -- utility/pure function tests (.ts)
- Renamed files to kebab-case matching source file names
- Fixed file extensions (.tsx → .ts where no JSX)
- Fixed relative mock paths for new directory depth
- Fixed lint error in utils.test.ts (constant binary expression)
- Added missing tests: apps-action, logout-action, lib/definitions (Zod schemas)
- Updated `frontend/AGENTS.md` with new test conventions
- **Result:** 17 test suites, 85 tests, all passing

#### Auth URL Restructure
- Moved frontend auth pages under `/auth/` prefix to match backend API grouping:
  - `/login` → `/auth/login`
  - `/register` → `/auth/register`
  - `/password-recovery` → `/auth/forgot-password`
  - `/password-recovery/confirm` → `/auth/reset-password`
- Updated all internal links, redirects, and middleware references
- Updated backend `email.py` password reset link to use new URL
- Updated all frontend and backend tests
- Updated `frontend/AGENTS.md` directory layout documentation

## Upcoming
- Tailwind CSS upgrade evaluation
