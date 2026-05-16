# Seeded Browser QA Runbook

Date: 2026-05-16

Use this runbook to prepare and manually verify a seeded SinFleet ERP demo environment. This is a readiness checklist, not an automated acceptance suite.

## 1. Prepare Environment

Copy env files if they do not exist:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

For repeatable QA and the smoke test, set stable demo passwords in `backend/.env`:

```env
DEMO_SUPER_ADMIN_EMAIL=superadmin@sinfleet.demo
DEMO_SUPER_ADMIN_PASSWORD=replace-with-local-demo-password
DEMO_COMPANY_ADMIN_PASSWORD=replace-with-local-demo-password
DEMO_RESET=false
```

If demo passwords are left blank, the seed command prints temporary passwords. Capture them for the browser run. Do not commit real credentials.

## 2. Prepare Database

Start local services:

```bash
docker compose up -d postgres redis
```

Generate Prisma client, apply migrations, and seed demo data:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed:demo
```

Use `DEMO_RESET=true npm run db:seed:demo` only when you intentionally want to delete and recreate the Sharma Roadlines Demo tenant.

## 3. Start App

```bash
npm run dev
```

Expected URLs:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:5001/api/health`
- Demo company: `SHARMA_ROADLINES_DEMO`
- Company Admin email: `admin@sharmaroadlines.demo`

## 4. Optional API Smoke Test

Run after the backend is started and the demo seed has completed:

```bash
npm run smoke:seeded
```

The smoke test checks health, Super Admin login, Company Admin login, and key authenticated API routes. It requires stable demo passwords in `backend/.env` or exported shell variables.

## 5. Manual Browser Checklist

### Super Admin Login

- Open `/admin/login`.
- Log in with the seeded Super Admin.
- Confirm redirect to `/admin`.
- Confirm dashboard cards render without blank panels.
- Confirm logout returns to `/admin/login`.

### Company Admin Login

- Open `/company/login`.
- Log in with `admin@sharmaroadlines.demo`.
- Confirm redirect to `/company/dashboard`.
- Confirm dashboard metrics, recent trips, and top clients load from seeded data.
- Confirm logout returns to `/company/login`.

### Companies

- Open `/admin/companies`.
- Search for `SHARMA_ROADLINES_DEMO`.
- Open company detail panel.
- Confirm company name, owner, plan, city/state, status, vehicle count, user count, and trip count look sane.
- Change status only on a temporary QA company, not on the demo tenant during sales prep.

### Vehicles

- Open `/company/vehicles`.
- Confirm seeded vehicle numbers such as `UP16`, `HR55`, and `DL01` appear.
- Test search, status filter, and type filter.
- Create, edit, and soft-delete a temporary QA vehicle.
- Confirm document expiry warnings are readable.

### Drivers

- Open `/company/drivers`.
- Confirm seeded drivers appear.
- Test search and status filter.
- Create, edit, and soft-delete a temporary QA driver.
- Confirm license expiry warnings are readable.

### Clients

- Open `/company/clients`.
- Confirm seeded construction, steel, cement, or hardware clients appear.
- Test search and status filter.
- Create, edit, and soft-delete a temporary QA client.
- Download a client statement PDF for an existing seeded client.

### Trips

- Open `/company/trips`.
- Confirm seeded trips and Indian routes appear.
- Test search, status/date/resource filters, and trip detail panel.
- Create a temporary trip with seeded vehicle, driver, and client.
- Move the temporary trip through valid statuses.
- Confirm freight, advance, received, and balance values remain sane.
- Download an invoice PDF for an existing seeded trip.

### Diesel

- Open `/company/diesel`.
- Confirm seeded diesel entries appear.
- Test date/search/resource filters.
- Create a temporary diesel entry.
- Confirm total equals liters multiplied by rate per liter.
- Edit and soft-delete the temporary entry.

### Expenses

- Open `/company/expenses`.
- Confirm seeded toll, loading, unloading, repair, parking, helper, and maintenance expenses appear.
- Test type/date/search filters.
- Create, edit, and soft-delete a temporary expense.

### Payments

- Open `/company/payments`.
- Confirm seeded payments appear.
- Test search and filters.
- Create a temporary trip-specific payment against a trip with outstanding balance.
- Confirm the linked trip received/balance values update.
- Soft-delete the temporary payment and confirm balance recalculates.

### Reports

- Open `/company/reports`.
- Open outstanding, vehicle profit, driver performance, client ledger, and document expiry reports.
- Confirm summary totals are present and not obviously negative or blank.
- Test report filters and date ranges.

### PDF Exports

- Download Trip Invoice PDF from a seeded trip.
- Download Client Statement PDF from a seeded client.
- Confirm file opens, filename is safe/readable, and content belongs to Sharma Roadlines Demo.
- Confirm an `EXPORT` row appears in `/company/audit-logs`.

### Excel Exports

- Download vehicle profit XLSX.
- Download driver performance XLSX.
- Download client ledger XLSX.
- Download outstanding XLSX.
- Confirm files open in a spreadsheet app and include seeded rows.
- Confirm `EXPORT` audit rows appear for downloads.

### Audit Logs

- Open `/admin/audit-logs`.
- Confirm the page loads and filters do not break layout.
- Filter by `exports` and `EXPORT` after export downloads.
- Open `/company/audit-logs`.
- Confirm company-scoped logs appear and no cross-tenant data is visible.

### Logout And Session Handling

- Log out from Admin and Company shells.
- Confirm protected routes redirect to the correct login page after logout.
- With an expired or cleared token, refresh a protected route and confirm login redirect.

### Mobile Sidebar

- Test around 390px width.
- Confirm menu button opens Admin and Company drawers.
- Confirm drawer closes after navigation.
- Confirm no content is hidden behind the drawer after close.

### 13-Inch Laptop Layout

- Test around 1280px by 800px.
- Confirm sidebars do not overlap content.
- Confirm filter bars wrap neatly.
- Confirm cards and forms do not clip.
- Confirm tables scroll inside their containers instead of causing page-level horizontal overflow.

## 6. Pass Criteria

- Core seeded records are visible in every module.
- Temporary CRUD checks work without breaking seeded demo data.
- PDF and Excel downloads succeed.
- Export audit rows are visible.
- Login/logout/session redirects work.
- Mobile and 13-inch laptop layouts remain stable.

## 7. Known Non-Blockers

- Richer dashboard charts are future work.
- Billing, documents, maintenance UI, and driver mobile dashboard are outside this demo QA pass.
- Redis-backed rate limiting, production monitoring, backups, and integration tests are required before first-client launch.
