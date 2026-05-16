# Next Tasks

## Immediate Next Implementation

- Create PostgreSQL database `sinfleet_erp_db`.
- Apply all Prisma migrations, including Industrial Hardening `AuditLog`.
- Verify audit log writes for vehicles, drivers, clients, trips, diesel, expenses, payments, and company status changes.
- Complete `docs/INDUSTRIAL_QA_CHECKLIST.md`.
- Complete `docs/SECURITY_CHECKLIST.md` before production deployment.
- Complete `docs/DEPLOYMENT_CHECKLIST.md` for the target hosting stack.
- Replace in-memory auth rate limiting with Redis-backed rate limiting before horizontal scaling.
- Run `npm run db:seed:demo` in local/demo environments.
- Complete `docs/QA_CHECKLIST.md` against the seeded Sharma Roadlines Demo tenant.
- Capture README screenshots after seeded browser QA.
- Run secure Super Admin seed in non-demo local/deployment environments.
- Verify login/refresh/logout against migrated PostgreSQL.
- Verify Super Admin company create/list/detail/status flow against migrated PostgreSQL.
- Verify Company Admin vehicle create/list/detail/update/status/delete flow against migrated PostgreSQL.
- Verify Company Admin driver and client create/list/detail/update/status/delete flows against migrated PostgreSQL.
- Verify Company Admin trip create/list/detail/update/status/delete flow against migrated PostgreSQL.
- Verify Company Admin diesel create/list/detail/update/delete flow against migrated PostgreSQL.
- Verify Company Admin expense create/list/detail/update/delete flow against migrated PostgreSQL.
- Verify Company Admin payment create/list/detail/update/delete flow against migrated PostgreSQL.
- Verify Company Admin outstanding, trip profit, and client summary reports against migrated PostgreSQL.
- Verify Company Admin dashboard, vehicle profit, driver performance, client ledger, and document expiry reports against migrated PostgreSQL and demo seed data.
- Verify Company Admin invoice PDF, client statement PDF, and Excel report downloads against migrated PostgreSQL and demo seed data.
- Confirm export audit rows appear under `/api/company/audit-logs?module=exports&action=EXPORT`.
- Run seeded browser visual QA at 13-inch laptop, 15-inch laptop, tablet, and mobile widths for all stabilized admin/company pages.
- Add tenant-aware CRUD APIs for billing and documents.
- Add automated integration tests with a test PostgreSQL database.

## Frontend Tasks

- Run visual QA against seeded company data for `/admin`, `/admin/companies`, `/company/dashboard`, `/company/vehicles`, `/company/drivers`, `/company/clients`, `/company/trips`, `/company/diesel`, `/company/expenses`, `/company/payments`, report pages, and export controls.
- Replace direct delete buttons with the shared confirmation dialog flow.
- Browser QA the new PDF/Excel export controls on trips, clients, outstanding, vehicle profit, driver performance, and client ledger pages.
- Confirm public landing and login screens remain overflow-free at mobile/tablet/laptop widths.
- Add richer dashboard charts once charting dependency is selected.
- Add screenshot assets under `docs/screenshots/` for README placeholders.
- Add token refresh handling in frontend API client.
- Add Company Admin route protection/redirect checks.
- Add Driver mobile-first dashboard.
- Add forms and tables for billing, documents, and deeper dashboard charts.

## DevOps Tasks

- Extend Docker Compose to run backend and frontend services after dependencies and lockfile are generated.
- Monitor upstream Next.js/Prisma advisories and upgrade when non-breaking patched releases are available.
- Add CI pipeline for lint, typecheck, test, and build.

## Future-Ready Tasks

- Add Redis adapter.
- Add WebSocket gateway.
- Add BullMQ job worker.
- Add GPS provider abstraction.
- Add OCR provider abstraction.
- Add WhatsApp notification adapter.
