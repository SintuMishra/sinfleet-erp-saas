# Industrial Hardening

Date: 2026-05-16

## Summary

Upgraded SinFleet ERP toward practical industrial SaaS readiness without changing existing business API contracts.

## Security

- Added frontend route protection for Super Admin and Company shells.
- Added automatic token refresh and session-expiry redirects.
- Added auth API rate limiting.
- Tightened CORS to configured origins and Helmet security headers.
- Added request input sanitization for body/query values.
- Removed raw Prisma query logging.
- Added secret redaction for structured backend logs.

## Audit Trail

- Added `AuditLog` Prisma model and migration.
- Added audit logging for successful mutations in vehicles, drivers, clients, trips, diesel, expenses, payments, and admin company changes.
- Added read APIs:
  - `GET /api/admin/audit-logs`
  - `GET /api/company/audit-logs`

## Reliability And Observability

- Added request ID middleware and `X-Request-Id` response header.
- Added structured JSON request logging.
- Improved error logging without leaking secrets or production stack traces.
- Improved `/api/health` with safe metadata.
- Added graceful shutdown for backend process termination.
- Added global frontend error boundary.

## Data Integrity And UX

- Improved trip vehicle/driver status recalculation so resources are not left incorrectly `ON_TRIP`.
- Kept payment delete reversal flow and trip balance recalculation intact.
- Replaced direct soft-delete buttons with confirmation dialogs across company modules.

## Documentation

- Added `docs/INDUSTRIAL_QA_CHECKLIST.md`.
- Added `docs/SECURITY_CHECKLIST.md`.
- Added `docs/DEPLOYMENT_CHECKLIST.md`.
- Updated README, API standard, architecture, AI context, current status, and next tasks.

## Verification

- `npm run db:generate` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed with escalated permissions because Next.js/Turbopack requires a local helper process during build.

## Notes

- Auth rate limiting is in-memory and suitable for single-node deployment. Use Redis-backed limits before horizontal scaling.
- Audit middleware stores safe request values and metadata, not full before/after database snapshots for every module.
