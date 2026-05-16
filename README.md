# SinFleet ERP

SinFleet ERP is a production-oriented multi-tenant Fleet Management ERP SaaS for transport companies, fleet operators, contractors, trucks, trailers, and Signa vehicle operations.

Company owner: **SinSoftware Solutions**

## Platform Goals

- Multi-company SaaS with strict tenant data isolation.
- Simple premium UI for transport owners, staff, and drivers.
- Modules for trips, diesel, expenses, vehicles, drivers, clients, payments, maintenance, documents, and profit/loss analytics.
- Future-ready architecture for Redis, WebSocket, BullMQ, GPS, OCR, AI analytics, WhatsApp, and mobile apps.

## Tech Stack

- Frontend: Next.js 16, TypeScript, Tailwind CSS, ShadCN-ready UI components, React Query, Axios.
- Backend: Node.js, Express, TypeScript, Prisma ORM 7, JWT access/refresh tokens, REST APIs.
- Database: PostgreSQL.

## Project Structure

```txt
sinfleet-erp-saas/
├── frontend/
├── backend/
├── docs/
├── prompts/
├── changelogs/
├── database/
├── scripts/
├── uploads/
├── README.md
├── PROJECT_ROADMAP.md
├── CURRENT_STATUS.md
├── NEXT_TASKS.md
├── ARCHITECTURE.md
├── AI_CONTEXT.md
└── .gitignore
```

## Local Setup

1. Copy environment file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start PostgreSQL and Redis locally:

```bash
docker compose up -d postgres redis
```

4. Generate Prisma client:

```bash
npm run db:generate
```

5. Run database migration:

```bash
npm run db:migrate
```

6. Seed the SinSoftware Solutions Super Admin:

```bash
npm run db:seed
```

7. Optionally seed a realistic demo tenant:

```bash
npm run db:seed:demo
```

8. Start development:

```bash
npm run dev
```

Default ports:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5001/api`

## Authentication

Seed login uses the values from your environment:

- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`

Login endpoint:

```bash
POST http://localhost:5001/api/auth/login
```

Body:

```json
{
  "email": "admin@sinsoftware.in",
  "password": "your-secure-password"
}
```

Auth APIs:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

See `docs/SEEDING.md` for secure seed instructions.

## Demo Data

Phase 10 adds a safe demo seed for sales walkthroughs and end-to-end QA readiness.

Run:

```bash
npm run db:seed:demo
```

The demo seed creates:

- Super Admin.
- Demo company: `Sharma Roadlines Demo`.
- Company code: `SHARMA_ROADLINES_DEMO`.
- Company Admin: `admin@sharmaroadlines.demo`.
- 10 vehicles, 9 drivers, 6 clients, 20 trips, diesel entries, expenses, payments, outstanding balances, and expiring documents.

Credential safety:

- Set `DEMO_SUPER_ADMIN_PASSWORD` and `DEMO_COMPANY_ADMIN_PASSWORD` in your ignored local env for repeatable demos.
- If demo passwords are not supplied, temporary passwords are generated and printed by the seed command.
- Do not commit real passwords.
- Re-running the seed updates existing demo records and avoids duplicate demo trips/bills/payments.
- Set `DEMO_RESET=true` only when you explicitly want to delete and recreate the `SHARMA_ROADLINES_DEMO` tenant.

QA checklist: `docs/QA_CHECKLIST.md`.

## Super Admin Panel

Frontend pages:

- `http://localhost:3000/admin/login`
- `http://localhost:3000/admin`
- `http://localhost:3000/admin/companies`

Super Admin company APIs:

- `POST /api/admin/companies`
- `GET /api/admin/companies`
- `GET /api/admin/companies/:id`
- `PATCH /api/admin/companies/:id`
- `PATCH /api/admin/companies/:id/status`

All `/api/admin/*` routes require a `SUPER_ADMIN` access token. Company Admin, Driver, and User roles are blocked.

## Company Admin Panel

Frontend pages:

- `http://localhost:3000/company/login`
- `http://localhost:3000/company/dashboard`
- `http://localhost:3000/company/vehicles`
- `http://localhost:3000/company/drivers`
- `http://localhost:3000/company/clients`
- `http://localhost:3000/company/trips`
- `http://localhost:3000/company/diesel`
- `http://localhost:3000/company/expenses`
- `http://localhost:3000/company/payments`
- `http://localhost:3000/company/reports`
- `http://localhost:3000/company/reports/outstanding`
- `http://localhost:3000/company/reports/vehicle-profit`
- `http://localhost:3000/company/reports/driver-performance`
- `http://localhost:3000/company/reports/client-ledger`
- `http://localhost:3000/company/reports/document-expiry`

Company vehicle APIs:

- `POST /api/company/vehicles`
- `GET /api/company/vehicles`
- `GET /api/company/vehicles/:id`
- `PATCH /api/company/vehicles/:id`
- `PATCH /api/company/vehicles/:id/status`
- `DELETE /api/company/vehicles/:id`

Company driver APIs:

- `POST /api/company/drivers`
- `GET /api/company/drivers`
- `GET /api/company/drivers/:id`
- `PATCH /api/company/drivers/:id`
- `PATCH /api/company/drivers/:id/status`
- `DELETE /api/company/drivers/:id`

Company client APIs:

- `POST /api/company/clients`
- `GET /api/company/clients`
- `GET /api/company/clients/:id`
- `PATCH /api/company/clients/:id`
- `PATCH /api/company/clients/:id/status`
- `DELETE /api/company/clients/:id`

Company trip APIs:

- `POST /api/company/trips`
- `GET /api/company/trips`
- `GET /api/company/trips/:id`
- `PATCH /api/company/trips/:id`
- `PATCH /api/company/trips/:id/status`
- `DELETE /api/company/trips/:id`

Company diesel APIs:

- `POST /api/company/diesel`
- `GET /api/company/diesel`
- `GET /api/company/diesel/:id`
- `PATCH /api/company/diesel/:id`
- `DELETE /api/company/diesel/:id`

Company expense APIs:

- `POST /api/company/expenses`
- `GET /api/company/expenses`
- `GET /api/company/expenses/:id`
- `PATCH /api/company/expenses/:id`
- `DELETE /api/company/expenses/:id`

Company payment APIs:

- `POST /api/company/payments`
- `GET /api/company/payments`
- `GET /api/company/payments/:id`
- `PATCH /api/company/payments/:id`
- `DELETE /api/company/payments/:id`

Company report APIs:

- `GET /api/company/reports/dashboard`
- `GET /api/company/reports/vehicle-profit`
- `GET /api/company/reports/driver-performance`
- `GET /api/company/reports/client-ledger`
- `GET /api/company/reports/document-expiry`
- `GET /api/company/reports/outstanding`
- `GET /api/company/reports/trip-profit/:tripId`
- `GET /api/company/reports/client-summary/:clientId`

These routes require a `COMPANY_ADMIN` or `USER` access token and always use the authenticated user's `companyId`.

## Required Memory Files

The following files must be updated after every major implementation step:

- `CURRENT_STATUS.md`
- `NEXT_TASKS.md`
- `AI_CONTEXT.md`
- `changelogs/YYYY-MM-DD-task-name.md`

## UI Guidelines

Phase 9 premium UI guidance lives in `docs/UI_GUIDELINES.md`.

## Industrial Hardening

The industrial hardening pass adds practical SaaS controls for real transport operators:

- Frontend route protection for Super Admin and Company workspaces.
- Automatic access-token refresh and session-expiry logout handling.
- Auth API rate limiting.
- Helmet security headers and strict configured CORS origins.
- Request IDs and structured backend logging with secret redaction.
- Input sanitization for request body/query values.
- `AuditLog` model and audit read APIs.
- Confirm-delete UX for soft-delete actions.
- Safer trip resource status recalculation and payment balance reversal handling.
- Graceful backend shutdown and safer health metadata.

Checklist docs:

- `docs/INDUSTRIAL_QA_CHECKLIST.md`
- `docs/SECURITY_CHECKLIST.md`
- `docs/DEPLOYMENT_CHECKLIST.md`

## Screenshot Placeholders

Add production screenshots under `docs/screenshots/` after a seeded visual QA run:

- `landing.png` - public landing experience.
- `company-dashboard.png` - premium fleet dashboard.
- `company-vehicles.png` - vehicle list, filters, and form.
- `company-trips.png` - trip operations workspace.
- `company-payments.png` - collections and payment form.
- `company-reports.png` - reports index/detail views.
- `admin-companies.png` - Super Admin tenant management.
