# Industrial QA Checklist

Date: 2026-05-16

## Core Smoke

- Run `npm run db:generate`.
- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run build`.
- Run migrations on a local PostgreSQL database.
- Run `npm run db:seed:demo`.
- Run `npm run smoke:seeded` with stable demo passwords.
- Confirm `/api/health` returns safe metadata and request id.

## Auth And Sessions

- Verify Super Admin login, refresh, logout, and expired session redirect.
- Verify Company Admin login, refresh, logout, and expired session redirect.
- Confirm invalid token returns 401 and frontend clears session.
- Confirm Company Admin cannot open `/admin/*`.
- Confirm Super Admin cannot use company CRUD routes.

## Business Modules

- Create/update/delete vehicle, driver, client, trip, diesel, expense, and payment.
- Confirm delete actions show confirmation warnings.
- Confirm soft-deleted records disappear from active lists.
- Confirm payment delete recalculates linked trip balance.
- Confirm trip status changes keep vehicle/driver statuses correct.
- Confirm dashboard and reports update after CRUD actions.

## Audit Trail

- Create/update/delete records in each business module.
- Change a company status as Super Admin.
- Confirm audit rows appear under `/api/admin/audit-logs`.
- Confirm company-scoped audit rows appear under `/api/company/audit-logs`.
- Confirm audit logs do not expose passwords, tokens, or secrets.

## Tenant Isolation

- Seed or create two companies.
- Confirm users only see their own company data.
- Confirm query params cannot switch tenant context.
- Confirm audit logs are company-scoped for company users.

## Mobile And UI

- Test company and admin shells at 390px width.
- Confirm sidebars open/close correctly.
- Confirm forms stack without overlap.
- Confirm tables/cards remain readable.

## Regression

- Re-run Phase 10 demo seed.
- Confirm no duplicate demo trips, bills, or payments.
- Re-run reports after seed and verify totals are sane.
