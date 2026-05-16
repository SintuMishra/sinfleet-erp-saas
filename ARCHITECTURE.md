# SinFleet ERP Architecture

## SaaS Model

SinFleet ERP is a multi-tenant SaaS platform operated by SinSoftware Solutions. Each transport company is represented as a tenant, and business data is isolated by `companyId`.

## Roles

- `SUPER_ADMIN`: SinSoftware Solutions platform owner.
- `COMPANY_ADMIN`: Admin user for a transport company.
- `DRIVER`: Mobile-first driver/operator user.
- `USER`: Future staff role for company employees.

## Backend Layers

- `config`: environment and service configuration.
- `constants`: roles, tenancy, and shared constants.
- `middleware`: auth, tenant context, errors, security.
- `modules`: business modules with controllers, services, schemas, routes.
- `routes`: API router composition.
- `services`: shared infrastructure services.
- `types`: Express and application type extensions.

## Frontend Layers

- `app`: Next.js App Router pages and layouts.
- `components/ui`: ShadCN-ready primitives.
- `components/layout`: app shell and navigation.
- `lib`: API client, query provider, utilities.
- `styles`: global styles.

## Tenancy Rule

All tenant-owned business tables must include `companyId`. Backend services must scope reads and writes by authenticated tenant context except for platform-level Super Admin APIs.

## Authentication

- Users authenticate with email and password.
- Passwords are stored as bcrypt hashes.
- Access tokens are short-lived JWTs.
- Refresh tokens are JWTs with server-side bcrypt-hashed records in PostgreSQL.
- Refresh token rotation revokes the previous token and creates a new token.
- Logout revokes the submitted refresh token.
- Auth middleware verifies the access token and reloads the active user from PostgreSQL.
- Frontend protected shells call `/api/auth/me` and redirect users without a valid role/session.
- The frontend API client automatically attempts refresh-token rotation after a 401 response and clears session state when refresh fails.
- Auth endpoints are protected by in-memory rate limiting suitable for a single-node deployment; use Redis-backed limits before horizontal scaling.

## Security And Observability

- Backend uses Helmet security headers, strict configured CORS origins, compression, JSON body limits, and input sanitization.
- Request IDs are assigned through `X-Request-Id` and included in responses/logs/errors.
- Backend logs are structured JSON and redact secret-like fields.
- Prisma query logging is disabled to avoid leaking raw business data or secrets.
- Error responses avoid stack traces and include request id metadata for unexpected errors.
- `/api/health` returns safe service metadata, environment, request id, timestamp, and uptime.
- Backend server handles `SIGINT` and `SIGTERM` for graceful shutdown and Prisma disconnect.

## Tenant Enforcement

- Super Admin has `companyId = null` and can access platform-wide APIs.
- Company Admin, Driver, and User roles must use their authenticated `companyId`.
- Tenant-owned services should use `getTenantCompanyId` for implicit tenant scope.
- Routes that accept a company id must call `assertTenantAccess`.

## Audit Trail

- `AuditLog` stores mutation audit events with company id, user id, module, action, entity id, safe values, metadata, and timestamp.
- Mutating routes for vehicles, drivers, clients, trips, diesel, expenses, payments, and admin company changes are audit logged.
- Export routes write `EXPORT` audit events under module `exports` with safe filename/type metadata.
- Super Admins can read audit logs at `/api/admin/audit-logs`.
- Company users can read company-scoped audit logs at `/api/company/audit-logs`.
- Audit values are sanitized/redacted to avoid storing passwords, tokens, authorization headers, or secret-like fields.

## Super Admin SaaS Control

- Super Admin company management lives under `/api/admin/companies`.
- These APIs are protected by `requireAuth` and `requireRole(SUPER_ADMIN)`.
- Company Admin, Driver, and User roles cannot access `/api/admin/*`.
- Company records store onboarding, owner, plan, limits, subscription dates, and lifecycle status.
- `Subscription` remains available for future billing and plan history.
- The frontend Super Admin panel lives under `/admin`.

## Company Vehicle Management

- Company vehicle management lives under `/api/company/vehicles`.
- These APIs are protected by `requireAuth` and `requireRole(COMPANY_ADMIN, USER)`.
- Super Admin is intentionally blocked from company vehicle APIs unless explicit tenant context support is added later.
- Every vehicle query is scoped by the authenticated user's `companyId`.
- Vehicle creation checks the company's `maxVehicles` plan limit.
- Vehicle deletion is soft delete through `deletedAt` and `INACTIVE` status.
- Vehicle schema is ready for trips, diesel, expenses, GPS device IDs, and document expiry alerts.

## Company Directory Management

- Company driver management lives under `/api/company/drivers`.
- Company client management lives under `/api/company/clients`.
- These APIs are protected by `requireAuth` and `requireRole(COMPANY_ADMIN, USER)`.
- Super Admin is intentionally blocked from these company routes unless tenant impersonation is explicitly added later.
- Driver phone and license number are unique per company.
- Client phone and GST number are unique per company where provided.
- Driver and client deletion is soft delete through `deletedAt`.
- Driver, client, and vehicle records are ready to connect into Phase 5 Trip Management.

## Company Trip Management

- Company trip management lives under `/api/company/trips`.
- These APIs are protected by `requireAuth` and `requireRole(COMPANY_ADMIN, USER)`.
- Every trip query is scoped by authenticated `companyId`.
- Trips can only attach vehicle, driver, and client records from the same company.
- Trip numbers are generated per company/day as `TRIP-YYYYMMDD-0001`.
- Trip creation marks vehicle and driver as `ON_TRIP` for running statuses.
- Delivered, paid, cancelled, and deleted trips release vehicle to `IDLE` and driver to `ACTIVE`.
- Trip schema is ready for diesel, expenses, billing, payments, and reports.

## Company Diesel And Expense Management

- Company diesel management lives under `/api/company/diesel`.
- Company expense management lives under `/api/company/expenses`.
- These APIs are protected by `requireAuth` and `requireRole(COMPANY_ADMIN, USER)`.
- Every diesel and expense query is scoped by authenticated `companyId`.
- Diesel entries must link to a company-owned vehicle and may link to a company-owned trip and driver.
- Expense entries may be trip-specific, vehicle-specific, driver-related, or general company expenses.
- Diesel total amount is calculated on the backend from liters multiplied by rate per liter.
- Diesel and expenses use soft delete through `deletedAt`.
- Summary totals are exposed for diesel amount, diesel liters, expense amount, trip expenses, vehicle expenses, and future profit reports.

## Company Payment And Outstanding Management

- Company payment management lives under `/api/company/payments`.
- Company report APIs live under `/api/company/reports`.
- These APIs are protected by `requireAuth` and `requireRole(COMPANY_ADMIN, USER)`.
- Every payment and report query is scoped by authenticated `companyId`.
- Payments must attach to a company-owned client and may attach to a company-owned trip for that same client.
- Trip-specific payments update `Trip.receivedAmount` and `Trip.balanceAmount`.
- Trip received amount is calculated as trip advance plus active trip-specific payments.
- Trip-specific overpayments are blocked so balances do not become negative.
- Payment deletion is soft delete through `deletedAt` and reverses the trip received/balance totals through recalculation.
- Outstanding reports aggregate client-wise and trip-wise pending balances.
- Trip profit reports calculate freight, received, balance, diesel total, expense total, and net profit.

## Company Reports And Dashboard Analytics

- Dashboard analytics live under `/api/company/reports/dashboard`.
- Vehicle profit, driver performance, client ledger, and document expiry reports live under `/api/company/reports/*`.
- These APIs are protected by `requireAuth` and `requireRole(COMPANY_ADMIN, USER)`.
- Every report query is scoped by authenticated `companyId`.
- Date-based reports default to the last 30 days when `fromDate` and `toDate` are omitted.
- Reports aggregate existing vehicle, driver, client, trip, diesel, expense, and payment data.
- Vehicle profit reports calculate freight, received, diesel cost, other expense, pending amount, and net profit.
- Driver performance reports calculate trips, delivered/cancelled count, freight, diesel cost, and other expense.
- Client ledger reports calculate total trips, total freight, received amount, outstanding, and trip breakdown.
- Document expiry reports cover vehicle insurance, fitness, permit, pollution, and driver license expiry.
- Report responses feed backend-only PDF and Excel export endpoints without duplicating business calculations.

## Company Exports

- Company export APIs live under `/api/company/exports`.
- These APIs are protected by `requireAuth` and `requireRole(COMPANY_ADMIN, USER)`.
- Every export resolves `companyId` from the authenticated user and scopes report/trip/client reads by that tenant.
- PDF exports use `pdfkit` and include trip invoice and client statement downloads.
- Excel exports use `exceljs` streaming workbooks for vehicle profit, driver performance, client ledger, and outstanding reports.
- Export responses set attachment `Content-Disposition`, safe filenames, private no-store cache headers, and `EXPORT` audit rows.

## Demo Seed And QA Readiness

- Phase 10 adds a frontend-demo-ready seed script at `backend/prisma/seed-demo.ts`.
- Root command: `npm run db:seed:demo`.
- The demo seed creates or updates one tenant: `Sharma Roadlines Demo` with company code `SHARMA_ROADLINES_DEMO`.
- Seeded data includes a Super Admin, Company Admin, vehicles, drivers, clients, trips, diesel entries, expenses, payments, outstanding balances, and expiring documents.
- The seed is idempotent where practical by using stable company code, emails, vehicle numbers, driver phones, client phones, trip numbers, bill numbers, and payment references.
- The seed never deletes demo tenant data unless `DEMO_RESET=true` is explicitly set.
- Demo passwords should come from ignored environment variables or generated temporary values printed during seed execution.
- QA coverage is documented in `docs/QA_CHECKLIST.md`.

## Future Integrations

- Redis for cache, sessions, rate limits, and pub/sub.
- WebSocket for live GPS and dashboard updates.
- BullMQ for reminders, document expiry alerts, OCR jobs, and analytics jobs.
- GPS provider abstraction for live vehicle tracking.
- OCR provider abstraction for receipts and diesel bills.
- WhatsApp provider abstraction for reminders and trip updates.
