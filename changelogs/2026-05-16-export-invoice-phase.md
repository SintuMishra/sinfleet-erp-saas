# Export & Invoice Phase

Date: 2026-05-16

## Summary

Added tenant-scoped backend PDF/XLSX exports and frontend download controls for invoice, statement, and report workflows.

## Backend

- Added company export routes under `/api/company/exports`.
- Added PDF trip invoice and client statement generation with `pdfkit`.
- Added Excel report generation with `exceljs` for vehicle profit, driver performance, client ledger, and outstanding reports.
- Added reusable export formatting, PDF, Excel, safe filename, and content-disposition helpers.
- Reused existing tenant-scoped report services where possible.
- Added `EXPORT` audit logging for all export endpoints.

## Frontend

- Added invoice PDF download controls on the trip workspace.
- Added statement PDF download controls on the client workspace.
- Added Excel download controls on vehicle profit, driver performance, client ledger, and outstanding report pages.
- Added loading and error states for export actions.

## Verification

- `npm run db:generate` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed with escalated permissions because Next.js/Turbopack requires a local helper process during build.
