# SinFleet ERP

**Multi-tenant Fleet Management ERP SaaS for transport operations, fleet finance, reporting, and operational control.**

[![CI](https://github.com/SintuMishra/sinfleet-erp-saas/actions/workflows/ci.yml/badge.svg)](https://github.com/SintuMishra/sinfleet-erp-saas/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-Full%20Stack-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

SinFleet ERP is a production-oriented fleet management platform designed around the operational and financial workflows of transport businesses.

It combines vehicle, driver, client, trip, fuel, expense, payment, reporting, export, and audit workflows inside a tenant-isolated SaaS architecture.

The platform separates **SinSoftware Solutions platform administration** from individual transport-company workspaces, with authenticated tenant context enforced by the backend rather than trusting client-supplied company identifiers.

---

## Product Overview

SinFleet brings day-to-day fleet operations and financial visibility into one system.

| Area | Capabilities |
| --- | --- |
| Fleet | Vehicle registry, operational status, document expiry and plan limits |
| Drivers | Driver directory, availability/status and licence expiry tracking |
| Clients | Customer directory, GST/contact information and account activity |
| Trips | Trip lifecycle, resource assignment, freight, advance and balance tracking |
| Fuel | Diesel entries linked to vehicles, drivers and trips |
| Expenses | Trip, vehicle, driver and general operating expenses |
| Payments | Client collections, trip allocations and outstanding recalculation |
| Analytics | Fleet dashboard, profit, performance, ledger and expiry reports |
| Exports | PDF invoices/statements and Excel operational reports |
| Governance | Tenant isolation, RBAC, audit trails and platform administration |

---

## Architecture

```text
                         ┌──────────────────────────────┐
                         │         Web Client           │
                         │  Next.js 16 + TypeScript     │
                         │  Tailwind CSS + React Query  │
                         └──────────────┬───────────────┘
                                        │
                                        │ REST / JWT
                                        ▼
                         ┌──────────────────────────────┐
                         │        Express API           │
                         │ Node.js + TypeScript         │
                         │ Auth · RBAC · Tenant Context │
                         └──────────────┬───────────────┘
                                        │
                                   Prisma ORM
                                        │
                                        ▼
                         ┌──────────────────────────────┐
                         │         PostgreSQL           │
                         │ Tenant-scoped business data  │
                         │ Auth · Audit · Operations    │
                         └──────────────────────────────┘
```

The repository is organized as an npm-workspace monorepo:

```text
sinfleet-erp-saas/
├── frontend/             # Next.js web application
├── backend/              # Express REST API
├── backend/prisma/       # Prisma schema, migrations and seed flows
├── docs/                 # Security, tenancy, QA and deployment docs
├── scripts/              # Operational and smoke-test utilities
├── .github/workflows/    # Continuous integration
├── ARCHITECTURE.md
└── README.md
```

---

## Multi-Tenant SaaS Design

Each transport company is represented as an isolated tenant.

Tenant-owned business records carry a `companyId`, while protected backend services resolve company scope from the authenticated user.

Core tenancy rules include:

- `SUPER_ADMIN` operates through platform-level administration APIs.
- Company users operate only inside their authenticated `companyId`.
- Tenant-owned queries and mutations are scoped on the backend.
- Cross-company vehicle, driver, client and trip relationships are rejected.
- Tenant routes do not rely on arbitrary client-provided company identifiers.
- Super Admin accounts use platform scope with `companyId = null`.

This design reduces the risk of accidental cross-tenant data access and keeps authorization decisions inside the API layer.

---

## Authentication & Authorization

SinFleet implements database-backed authentication rather than frontend-only access control.

```text
Login
  │
  ├── bcrypt password verification
  │
  ▼
Access JWT + Refresh JWT
  │
  ├── short-lived access token
  ├── server-side hashed refresh-token record
  └── refresh-token rotation
             │
             ▼
      Protected API request
             │
             ├── authenticate user
             ├── validate active session
             ├── enforce role
             └── enforce tenant scope
```

Implemented controls include:

- bcrypt password hashing
- short-lived JWT access tokens
- refresh-token rotation
- bcrypt-hashed refresh-token storage
- logout token revocation
- authenticated `/api/auth/me`
- frontend session restoration
- automatic refresh after eligible `401` responses
- role-based route protection
- tenant-aware authorization

Primary roles are:

- `SUPER_ADMIN`
- `COMPANY_ADMIN`
- `USER`
- `DRIVER`

---

## Fleet Operations

### Vehicles

Vehicle management supports company-scoped CRUD operations, search and status filtering, plan-limit enforcement, operational state, soft deletion, and document-expiry data.

### Drivers

Driver management includes tenant-scoped records, operational status, licence information, licence-expiry tracking, search, filtering, and soft deletion.

### Clients

Client management maintains company-specific customer records, GST and contact information, operational relationships, search, filtering, and soft deletion.

### Trips

Trips connect a company's vehicle, driver and client records into an operational workflow.

SinFleet validates that assigned resources belong to the same tenant and generates trip numbers per company/day.

Trip state changes coordinate vehicle and driver availability so completed, cancelled, delivered, paid, or deleted work does not leave resources incorrectly marked as on-trip.

---

## Fuel & Expense Management

Diesel entries can be associated with tenant-owned vehicles, trips and drivers.

Diesel totals are calculated by the backend from:

```text
Litres × Rate Per Litre = Total Diesel Amount
```

Expenses support:

- trip-specific expenses
- vehicle-specific expenses
- driver-related expenses
- general company expenses

Diesel and expense records remain tenant-scoped and support soft-delete workflows.

---

## Payments & Outstanding Management

Payments support client collections with optional trip allocation.

For trip-specific payments, SinFleet maintains:

- advance amount
- received amount
- outstanding balance
- client association
- trip association

The backend blocks trip overpayments that would create a negative balance.

When an allocated payment is soft-deleted, the trip's received and outstanding amounts are recalculated rather than leaving stale financial totals.

---

## Reporting & Analytics

SinFleet provides tenant-scoped operational and financial reporting using the same business data as the transaction modules.

Implemented reporting includes:

- dashboard operational analytics
- vehicle profitability
- driver performance
- client ledger
- document expiry
- outstanding balances
- trip profitability
- client account summaries

Dashboard analytics can aggregate:

- fleet status
- trip status
- freight
- received amount
- outstanding amount
- diesel cost
- expenses
- net profit
- document expiry
- recent trips
- top clients
- vehicle profitability

Date-based analytical reports can default to a recent operating window when explicit dates are not supplied.

Report calculations are also reused by backend export services to avoid duplicating financial logic between UI and generated files.

---

## PDF & Excel Exports

SinFleet generates operational documents on the backend.

### PDF

- Trip invoice
- Client statement

### Excel

- Vehicle profit
- Driver performance
- Client ledger
- Outstanding balances

PDF generation uses `pdfkit`.

Spreadsheet generation uses `exceljs`.

Exports use authenticated tenant data, safe attachment filenames, private cache controls, and corresponding `EXPORT` audit events.

---

## Audit Trail

Operational mutations are recorded through the `AuditLog` model.

Audit records can include:

- tenant/company
- authenticated user
- module
- action
- entity identifier
- sanitized values
- metadata
- timestamp

Audit values are sanitized to avoid persisting passwords, tokens, authorization headers, and other secret-like fields.

Separate audit views are available for platform administrators and tenant workspaces.

---

## Security & Operational Hardening

The backend includes practical controls for a production-oriented SaaS architecture:

- Helmet security headers
- configured CORS origin enforcement
- authentication rate limiting
- input sanitization
- request IDs through `X-Request-Id`
- structured JSON logging
- secret-field redaction
- centralized error handling
- safe production error responses
- graceful `SIGINT` and `SIGTERM` shutdown
- Prisma disconnect during shutdown
- soft-delete workflows for operational records

Prisma query logging is disabled to reduce accidental exposure of business data and secrets.

The current authentication rate limiter is suitable for a single-node deployment. A shared store such as Redis should be used before horizontally scaling the API.

---

## API Surface

The REST API is separated into authentication, platform administration, and tenant business operations.

```text
/api/auth/*                 Authentication and session lifecycle
/api/admin/companies/*      Platform tenant administration
/api/admin/audit-logs       Platform audit trail
/api/company/vehicles/*     Fleet management
/api/company/drivers/*      Driver management
/api/company/clients/*      Client management
/api/company/trips/*        Trip operations
/api/company/diesel/*       Fuel management
/api/company/expenses/*     Expense management
/api/company/payments/*     Payment management
/api/company/reports/*      Analytics and reporting
/api/company/exports/*      PDF and Excel exports
/api/company/audit-logs     Tenant audit trail
```

Company APIs resolve tenant context from the authenticated session.

---

## Database

SinFleet uses **PostgreSQL** with **Prisma ORM**.

The data model covers platform tenancy, users and authentication alongside fleet operations including companies, users, refresh tokens, vehicles, drivers, clients, trips, diesel, expenses, payments, subscriptions, and audit logs.

Prisma migrations are maintained under:

```text
backend/prisma/migrations/
```

Generated Prisma Client output is intentionally excluded from Git and regenerated from the schema during local development and CI.

---

## Continuous Integration

Every push and pull request to `main` runs the GitHub Actions verification pipeline.

```text
npm ci
   │
   ▼
Generate Prisma Client
   │
   ▼
TypeScript Typecheck
   │
   ▼
ESLint
   │
   ▼
Production Build
   │
   ▼
Authentication Foundation Verification
```

The workflow uses Node.js 22 and generates Prisma Client on a clean runner before application verification.

The current CI pipeline verifies both frontend and backend workspaces.

---

## Tech Stack

### Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- React Query
- Axios
- App Router
- reusable responsive UI components

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- JWT authentication
- bcrypt
- Zod
- Helmet
- REST APIs

### Data & Infrastructure

- PostgreSQL
- Redis-ready infrastructure
- Docker Compose
- Prisma migrations
- GitHub Actions

### Documents & Exports

- PDFKit
- ExcelJS

---

## Local Development

### Requirements

- Node.js `>=20.19`
- npm `>=10`
- Docker / Docker Compose
- PostgreSQL 16
- Redis 7

Clone the repository:

```bash
git clone https://github.com/SintuMishra/sinfleet-erp-saas.git
cd sinfleet-erp-saas
```

Install dependencies:

```bash
npm install
```

Create local environment files from the committed examples:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Keep real credentials and secrets only in ignored local environment files.

Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

Generate Prisma Client:

```bash
npm run db:generate
```

Apply database migrations:

```bash
npm run db:migrate
```

Seed the platform administrator when required:

```bash
npm run db:seed
```

For an isolated local or demonstration environment, realistic demo data can optionally be created with:

```bash
npm run db:seed:demo
```

Start both frontend and backend workspaces:

```bash
npm run dev
```

Default development endpoints:

```text
Frontend     http://localhost:3000
Backend API  http://localhost:5001/api
Health       http://localhost:5001/api/health
```

---

## Verification

The repository exposes repeatable engineering checks:

```bash
npm run db:generate
npm run typecheck
npm run lint
npm run build
npm run verify:auth
```

For a running, migrated, and seeded demo environment:

```bash
npm run smoke:seeded
```

The seeded smoke flow exercises application health, authentication, and core protected routes.

---

## Docker

The repository includes Docker configuration for local PostgreSQL and Redis infrastructure.

Start the infrastructure services with:

```bash
docker compose up -d postgres redis
```

PostgreSQL data is stored in a named Docker volume so normal container recreation does not discard the local database.

---

## Engineering Decisions

### Tenant Context Belongs to the Backend

Business services derive tenant scope from authenticated identity instead of trusting arbitrary frontend `companyId` values. This keeps a critical authorization boundary under server control.

### Report Logic Is Reused for Exports

PDF and Excel endpoints consume backend report calculations rather than maintaining separate financial implementations. This reduces the chance of the UI, API reports, and exported documents calculating different values.

### Generated Clients Stay Generated

Prisma Client artifacts are not committed. Local environments and CI regenerate them from the Prisma schema.

### Financial Totals Are Recalculated

Trip payment totals are recalculated after relevant payment changes instead of relying only on incremental client-side state.

### Operational Deletion Is Non-Destructive

Core operational records use soft-delete workflows where appropriate, preserving history while removing records from active workflows.

### Audit Data Is Sanitized

Audit events preserve useful operational history while filtering secret-like values before persistence.

---

## Documentation

Detailed engineering and operational references are maintained inside the repository.

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — system architecture and module behavior
- [`docs/TENANCY.md`](docs/TENANCY.md) — tenant-isolation rules
- [`docs/SECURITY.md`](docs/SECURITY.md) — security guidance
- [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md) — deployment preflight
- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) — application QA
- [`docs/SEEDED_BROWSER_QA_RUNBOOK.md`](docs/SEEDED_BROWSER_QA_RUNBOOK.md) — seeded browser validation
- [`docs/EXPORTS.md`](docs/EXPORTS.md) — PDF and Excel export behavior

---

## Product Screenshots

Product screenshots will be added after the seeded visual QA pass so the repository documents verified application states rather than placeholder UI.

Planned repository views include:

- Company Dashboard
- Trip Operations
- Payments / Outstanding
- Vehicle Profit & Reports
- Super Admin Company Management

---

## Current Scope

SinFleet currently provides the core web-based fleet ERP foundation: tenant administration, authentication and authorization, fleet resources, driver and client management, trip operations, diesel and expenses, payments and outstanding tracking, operational analytics, PDF and Excel exports, and audit visibility.

Production rollout still requires environment-specific deployment validation, managed database backups, monitoring, and production-scale shared rate limiting.

Additional areas such as live GPS, maintenance workflows, document automation, richer charts, and dedicated driver/mobile experiences remain future extensions rather than current capabilities.

---

## Author

**Sintu Mishra**

Software Engineer — Backend, Systems & Robotics

[GitHub](https://github.com/SintuMishra) · [LinkedIn](https://www.linkedin.com/in/sintu-mishra-3o11/) · [Portfolio](https://portfolio-flame-six-93wdoxmah1.vercel.app/)
