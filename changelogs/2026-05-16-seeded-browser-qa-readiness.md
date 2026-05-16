# Seeded Browser QA Readiness

Date: 2026-05-16

## Added

- Created `docs/SEEDED_BROWSER_QA_RUNBOOK.md` with ordered setup, smoke test, manual browser QA, export, audit, logout, mobile, and 13-inch laptop checks.
- Added `npm run smoke:seeded` for lightweight seeded API smoke testing.
- Added `scripts/smoke-seeded-demo.mjs` to check health, Super Admin login, Company Admin login, and basic authenticated routes.

## Fixed

- Clarified local setup documentation so backend and Prisma commands use `backend/.env`, not only root `.env`.

## Notes

- No UI redesign, backend route changes, or new business modules were added.
- Manual seeded browser QA still needs to be executed against a migrated local PostgreSQL database.
