# AI Context

Date: 2026-05-16

## Product

SinFleet ERP is a multi-tenant Fleet Management ERP SaaS owned by SinSoftware Solutions. Target users are transport businesses with 10-100+ vehicles, including trucks, trailers, Signa vehicles, transport contractors, and fleet operators.

## Latest Architecture Summary

- Root npm workspace with `frontend` and `backend`.
- Frontend: Next.js 16 App Router, TypeScript, Tailwind CSS, ShadCN-ready components, Axios, React Query.
- Backend: Express, TypeScript, Prisma ORM 7.8 with PostgreSQL driver adapter, JWT access/refresh authentication, REST API modules.
- Database: PostgreSQL through Prisma.
- Future-ready services are represented by environment variables and architecture docs: Redis, WebSocket, BullMQ, GPS, OCR, AI analytics, WhatsApp.

## Database Schema Summary

Core platform tables:

- `Company`
- `User`
- `RefreshToken`
- `Subscription`

Tenant business tables:

- `Vehicle`
- `DriverProfile`
- `Client`
- `Trip`
- `Diesel`
- `Expense`
- `Payment`
- `MaintenanceRecord`
- `Document`

All business tables include `companyId` for tenant isolation.

Initial SQL migration exists at `backend/prisma/migrations/20260516000000_initial_schema/migration.sql`.
The Company model now includes SaaS onboarding fields: `companyName`, `companyCode`, owner contact fields, location, GST number, plan, max vehicles/users, subscription dates, and status.
Phase 3 vehicle migration exists at `backend/prisma/migrations/20260516000001_phase_3_vehicle_management/migration.sql`.
The Vehicle model now includes type, make/model/year, fuel, ownership, capacity, operational status, RC number, document expiry dates, optional GPS device id, notes, and soft delete.
Phase 4 driver/client migration exists at `backend/prisma/migrations/20260516000002_phase_4_drivers_clients/migration.sql`.
DriverProfile now includes standalone driver details, salary type/amount, license expiry, status, notes, and soft delete.
Client now includes client/contact/billing details, payment terms, status, notes, and soft delete.
Phase 5 trip migration exists at `backend/prisma/migrations/20260516000003_phase_5_trip_management/migration.sql`.
Trip now includes per-company trip number, vehicle/driver/client links, route, loading/unloading dates, material/quantity, freight/advance/balance, rate type, status lifecycle, notes, and soft delete.
Phase 6 diesel/expense migration exists at `backend/prisma/migrations/20260516000004_phase_6_diesel_expense/migration.sql`.
Diesel entries track trip/vehicle/driver links, diesel date, pump, liters, rate, auto-calculated total amount, payment mode, bill details, odometer, notes, receipt URL, and soft delete.
Expense entries track optional trip/vehicle/driver links, date, expense type, amount, payment mode, paid-to, bill details, notes, receipt URL, and soft delete.
Phase 7 payments/outstanding migration exists at `backend/prisma/migrations/20260516000005_phase_7_payments_outstanding/migration.sql`.
Trip now includes `receivedAmount` for advance plus trip-specific payments, and `Payment` now tracks client/trip links, payment date, amount, payment mode, reference number, notes, receipt URL, and soft delete.
Phase 8 Reports + Dashboard Analytics uses the existing schema and adds no new migration. Reports aggregate vehicles, drivers, clients, trips, diesel, expenses, payments, outstanding, profit, and document expiry from tenant-owned tables.
Phase 9 Ultra-Premium UI/UX Redesign is frontend-only and adds no backend or database changes. It introduces a dark navy/slate SaaS shell, white/glass cards, cyan/blue accents, premium topbars/sidebars, reusable UI primitives, and UI guidelines.
Phase 10 Demo Data Seeder + End-to-End QA Readiness adds a backend Prisma demo seed script and QA checklist without changing database schema or application APIs. It seeds Sharma Roadlines Demo with realistic Indian transport data for visual demos and QA.
Industrial Hardening adds one database migration for `AuditLog`, frontend route protection/token refresh, backend auth rate limiting, request IDs, structured logging, strict CORS, sanitization, safer health metadata, graceful shutdown, confirm-delete UX, audit log APIs, and QA/security/deployment checklists.

## Module Structure

Backend modules currently scaffolded:

- `admin`
- `auth`
- `company`
- `companies`
- `health`

Frontend currently includes:

- Dashboard landing page.
- Super Admin login page.
- Super Admin dashboard shell.
- Super Admin companies management page.
- Company Admin login page.
- Company Admin dashboard.
- Company vehicle management page.
- Company driver management page.
- Company client management page.
- Company trip management page.
- Company diesel management page.
- Company expense management page.
- Company payment management page.
- Company outstanding report page.
- Company reports index page.
- Company vehicle profit report page.
- Company driver performance report page.
- Company client ledger report page.
- Company document expiry report page.
- App shell.
- Button and card UI primitives.
- Premium reusable UI primitives for page headers, stat cards, status badges, empty states, data containers, filter bars, form sections, confirmation dialog placeholder, and language toggle placeholder.
- API client.
- React Query provider.

## Authentication Flow

- Login endpoint validates email/password against PostgreSQL user records.
- Passwords are stored with bcrypt hashes.
- Login issues a JWT access token and a JWT refresh token.
- Refresh tokens are stored server-side as bcrypt hashes in `RefreshToken`.
- Refresh endpoint verifies, compares hash, revokes the old refresh token, and creates a rotated refresh token.
- Logout endpoint revokes the supplied refresh token.
- `GET /api/auth/me` returns the active authenticated user.
- Auth middleware validates `Authorization: Bearer <token>` and reloads the active user from PostgreSQL.
- Role guard restricts APIs by role.

## SaaS Tenancy Logic

- `companyId` belongs to company-level users.
- Super Admin may access platform-level resources.
- Company Admin and Driver/User APIs must resolve tenant context from authenticated user.
- Tenant-owned queries must filter by `companyId`.
- Use `requireTenant`, `getTenantCompanyId`, and `assertTenantAccess` for tenant-owned routes.
- Super Admin company APIs live under `/api/admin/companies` and are protected by `requireRole(SUPER_ADMIN)`.
- Company vehicle APIs live under `/api/company/vehicles` and are protected by `requireRole(COMPANY_ADMIN, USER)`.
- Company driver APIs live under `/api/company/drivers` and are protected by `requireRole(COMPANY_ADMIN, USER)`.
- Company client APIs live under `/api/company/clients` and are protected by `requireRole(COMPANY_ADMIN, USER)`.
- Company trip APIs live under `/api/company/trips` and are protected by `requireRole(COMPANY_ADMIN, USER)`.
- Trips can only attach vehicle, driver, and client records from the authenticated user's company.
- Company diesel APIs live under `/api/company/diesel` and are protected by `requireRole(COMPANY_ADMIN, USER)`.
- Company expense APIs live under `/api/company/expenses` and are protected by `requireRole(COMPANY_ADMIN, USER)`.
- Diesel and expense records can only attach trip, vehicle, and driver records from the authenticated user's company.
- Company payment APIs live under `/api/company/payments` and are protected by `requireRole(COMPANY_ADMIN, USER)`.
- Payment records must attach a company-owned client and may attach a company-owned trip for that same client.
- Company report APIs live under `/api/company/reports` and are protected by `requireRole(COMPANY_ADMIN, USER)`.
- Report APIs include dashboard analytics, vehicle profit, driver performance, client ledger, document expiry, outstanding, trip profit, and client summary.
- Company export APIs live under `/api/company/exports` and are protected by `requireRole(COMPANY_ADMIN, USER)`.
- Export APIs include trip invoice PDF, client statement PDF, vehicle profit XLSX, driver performance XLSX, client ledger XLSX, and outstanding XLSX.
- Exports reuse tenant-scoped report services where applicable, generate backend-only files through `pdfkit` and `exceljs`, set safe `Content-Disposition` filenames, and write `EXPORT` audit logs.
- Super Admin is blocked from company vehicle APIs unless an explicit tenant context feature is added later.

## Environment Variables

See `.env.example` for:

- `PORT`
- `API_PREFIX`
- `CORS_ORIGIN`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `REDIS_URL`
- future provider keys.
- `SUPER_ADMIN_NAME`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`
- `BCRYPT_SALT_ROUNDS`

## Deployment Information

Deployment is Docker-ready with initial Dockerfiles for frontend/backend and Compose services for PostgreSQL and Redis. Recommended production stack:

- Frontend: Vercel, Netlify, or containerized Next.js.
- Backend: containerized Node.js service.
- Database: managed PostgreSQL.
- Redis: managed Redis.
- Storage: S3-compatible object storage for uploads.

## Latest Project State

Responsive Stabilization was implemented on 2026-05-16 after the Export & Invoice Phase. The latest frontend pass keeps the premium UI and business logic intact while tightening layout behavior across MacBook Air/standard laptop/tablet/mobile widths. It adds responsive page/workspace/summary/filter helpers, reusable responsive container/table wrappers, safer shell/sidebar/header overflow behavior, public shell/landing stabilization, export button wrapping, and breakpoint fixes across admin, company CRUD, dashboard, and report pages.

## Verification State

- `npm run db:generate`: passed after Industrial Hardening and generated `AuditLog` client types.
- `npm run db:seed:demo`: script added; run after migrations against a live local PostgreSQL database.
- `backend/prisma/seed-demo.ts`: standalone TypeScript compile check passed.
- `npm run verify:auth`: passed with escalated permissions because `tsx` requires local IPC permissions.
- `npm run typecheck`: passed after Industrial Hardening.
- `npm run lint`: passed after Industrial Hardening.
- `npm run build`: passed after Industrial Hardening with escalated permissions because Turbopack requires local helper process permissions.
- `npm run db:generate`: passed after Export & Invoice Phase implementation.
- `npm run typecheck`: passed after Export & Invoice Phase implementation.
- `npm run lint`: passed after Export & Invoice Phase implementation.
- `npm run build`: passed after Export & Invoice Phase implementation with escalated permissions because Turbopack requires a local helper process.
- `npm run typecheck`: passed after Responsive Stabilization.
- `npm run lint`: passed after Responsive Stabilization.
- `npm run build`: passed after Responsive Stabilization with escalated permissions because Turbopack requires a local helper process.
- `npm run dev`: running locally.
- Frontend health: `http://localhost:3000` returns HTTP 200.
- Backend health: `http://localhost:5001/api/health` returns `status: ok`.
- `npm audit --audit-level=moderate`: reports 5 moderate upstream advisories from Next.js/Prisma dependency trees; force fix would downgrade/break major packages.
