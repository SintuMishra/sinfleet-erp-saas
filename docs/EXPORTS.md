# Exports

Date: 2026-05-16

SinFleet ERP export endpoints generate files on the backend so tenant isolation, report calculations, and audit logging remain server-controlled.

## Libraries

- PDF: `pdfkit`
- Excel: `exceljs`

## Endpoints

- `GET /api/company/exports/trip-invoice/:tripId.pdf`
- `GET /api/company/exports/client-statement/:clientId.pdf`
- `GET /api/company/exports/vehicle-profit.xlsx`
- `GET /api/company/exports/driver-performance.xlsx`
- `GET /api/company/exports/client-ledger.xlsx`
- `GET /api/company/exports/outstanding.xlsx`

All routes require `COMPANY_ADMIN` or `USER` auth. The backend resolves the tenant from the JWT user and never accepts a client-supplied company id.

## Behavior

- PDF exports are streamed with `pdfkit`.
- Excel exports use `exceljs` streaming workbook writer.
- Report exports reuse existing company report services and cap generated rows through existing report query limits.
- File responses set `Content-Disposition: attachment`, `Cache-Control: private, no-store`, and a safe generated filename.
- Each export writes an `EXPORT` audit log under module `exports`.

## Example Filenames

- `trip-invoice-trip-20260516-0001-sharma-roadlines-demo.pdf`
- `client-statement-mahadev-cement-sharma-roadlines-demo-2026-05-16.pdf`
- `vehicle-profit-sharma-roadlines-demo-latest.xlsx`
- `driver-performance-sharma-roadlines-demo-latest.xlsx`
- `client-ledger-sharma-roadlines-demo-latest.xlsx`
- `outstanding-sharma-roadlines-demo-2026-05-16.xlsx`

## QA Flow

1. Log in as a Company Admin.
2. Open `/company/trips`, select a trip, and download the invoice PDF.
3. Open `/company/clients` and download a client statement PDF.
4. Open report pages for outstanding, vehicle profit, driver performance, and client ledger.
5. Apply filters and download Excel files.
6. Confirm downloaded files open locally.
7. Confirm audit rows exist at `/api/company/audit-logs?module=exports&action=EXPORT`.
