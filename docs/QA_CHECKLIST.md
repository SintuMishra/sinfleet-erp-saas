# SinFleet ERP QA Checklist

Date: 2026-05-16

Use this checklist after running the demo seed against a migrated local database.

## Demo Setup

- Run `npm run db:generate`.
- Run `npm run db:migrate`.
- Run `npm run db:seed:demo`.
- Start the app with `npm run dev`.
- Confirm frontend opens at `http://localhost:3000`.
- Confirm backend health returns OK at `http://localhost:5001/api/health`.
- Optionally run `npm run smoke:seeded` after setting stable demo passwords.
- Follow the ordered seeded browser runbook in `docs/SEEDED_BROWSER_QA_RUNBOOK.md`.

## Demo Credentials

Use environment-provided or generated credentials only.

- Super Admin email: `DEMO_SUPER_ADMIN_EMAIL`, or `SUPER_ADMIN_EMAIL`, or generated demo fallback.
- Super Admin password: `DEMO_SUPER_ADMIN_PASSWORD`, or `SUPER_ADMIN_PASSWORD`, or generated and printed during seed.
- Company Admin email: `admin@sharmaroadlines.demo`.
- Company Admin password: `DEMO_COMPANY_ADMIN_PASSWORD`, or generated and printed during seed.

Do not commit real demo passwords. For repeatable demos, set local ignored env values before seeding.

## Super Admin Flow

- Log in at `/admin/login`.
- Confirm `/admin` dashboard loads.
- Confirm Sharma Roadlines Demo appears in `/admin/companies`.
- Search company by `SHARMA_ROADLINES_DEMO`.
- Open company detail panel.
- Confirm owner name, city, state, plan, and status.
- Confirm creating another company still works.
- Confirm status update does not affect Sharma Roadlines data unexpectedly.

## Company Admin Flow

- Log in at `/company/login`.
- Confirm `/company/dashboard` loads real seeded metrics.
- Confirm fleet totals, active trips, pending payment, diesel cost, expenses, net profit, and expiring documents are visible.
- Confirm recent trips and top clients show seeded records.

## Vehicle CRUD

- Open `/company/vehicles`.
- Confirm 8-12 seeded vehicles appear with Indian numbers like `UP16`, `HR55`, and `DL01`.
- Filter by status and vehicle type.
- Search by vehicle number.
- Create a temporary test vehicle.
- Edit make/model/status.
- Soft delete the temporary vehicle.
- Confirm expiring document alerts appear for selected seeded vehicles.

## Driver CRUD

- Open `/company/drivers`.
- Confirm 8-10 seeded drivers appear.
- Search by driver name or phone.
- Filter by status.
- Create a temporary test driver.
- Edit phone, salary type, and status.
- Soft delete the temporary driver.
- Confirm license expiry alerts appear for selected seeded drivers.

## Client CRUD

- Open `/company/clients`.
- Confirm cement, steel, construction, and hardware clients appear.
- Search by client name or city.
- Filter by status.
- Create a temporary test client.
- Edit contact/payment terms.
- Soft delete the temporary client.

## Trip Operations

- Open `/company/trips`.
- Confirm 15-25 seeded trips appear.
- Verify routes such as Greater Noida to Jaipur, Delhi to Lucknow, and Ghaziabad to Kanpur.
- Create a temporary trip using seeded vehicle, driver, and client.
- Change trip status through booked, loading, in transit, delivered, billed, and paid states where valid.
- Confirm vehicle/driver statuses update for running trips.
- Confirm freight, advance, received, and balance amounts look correct.

## Diesel Entries

- Open `/company/diesel`.
- Confirm diesel entries exist for seeded trips.
- Filter by date range.
- Search by pump/bill/trip details.
- Create a temporary diesel entry.
- Confirm total amount is liters multiplied by rate per liter.
- Edit and soft delete the temporary diesel entry.

## Expense Entries

- Open `/company/expenses`.
- Confirm toll, loading, unloading, repair, parking, helper, and maintenance expenses exist.
- Filter by type/date.
- Create a temporary expense.
- Edit and soft delete the temporary expense.

## Payment Entries

- Open `/company/payments`.
- Confirm partial and full payments exist.
- Search by client/reference.
- Create a temporary payment for a trip with outstanding balance.
- Confirm the trip received/balance totals update.
- Soft delete the temporary payment and confirm balance recalculates.

## Reports

- Open `/company/reports/outstanding`.
- Confirm client-wise and trip-wise pending balances.
- Open `/company/reports/vehicle-profit`.
- Confirm diesel, expense, freight, pending, and net profit columns/cards.
- Open `/company/reports/driver-performance`.
- Confirm trip count and driver totals.
- Open `/company/reports/client-ledger`.
- Confirm client breakdown by trips, received amount, and outstanding.
- Open `/company/reports/document-expiry`.
- Confirm vehicle and driver expiry alerts.

## Mobile Layout

- Test at a mobile viewport around 390px wide.
- Confirm company sidebar opens from the menu button and closes after navigation.
- Confirm admin sidebar opens from the menu button.
- Confirm forms stack without overlapping text.
- Confirm record cards are readable without horizontal scrolling except true data tables.

## Tenant Isolation

- Log in as Super Admin and confirm company APIs are not accessible from the company UI without tenant context.
- Log in as Company Admin and confirm admin pages are not accessible.
- Create a second company and Company Admin.
- Confirm each Company Admin sees only their own vehicles, drivers, clients, trips, diesel, expenses, payments, and reports.
- Confirm search/filter endpoints never return another tenant's data.
