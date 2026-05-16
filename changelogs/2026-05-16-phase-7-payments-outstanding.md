# 2026-05-16 - Phase 7 Payment + Outstanding Management

## Summary

Implemented Company Admin payment tracking, trip balance recalculation, outstanding reports, and basic trip profit/loss.

## Added

- Company-side `/api/company/payments` backend module.
- Company-side `/api/company/reports` backend module.
- Payment create/list/detail/update/delete APIs.
- Outstanding, trip profit, and client summary report APIs.
- `COMPANY_ADMIN` and `USER` access guard for payment and report APIs.
- Strict `companyId` scoping from authenticated user context.
- Client and trip same-company validation for payments.
- Trip/client match validation for trip-specific payments.
- Trip `receivedAmount` field.
- Trip balance recalculation from advance plus active trip-specific payments.
- Trip-specific payment overpayment protection.
- Payment soft delete through `deletedAt`.
- Payment deletion and update reversal through trip total recalculation.
- Phase 7 Prisma migration for trip received amount and expanded payment fields.
- Company payments page at `/company/payments`.
- Company outstanding report page at `/company/reports/outstanding`.
- Trip detail profit summary using the trip profit report endpoint.
- Hindi/English-ready label additions.

## Updated

- README.
- API documentation.
- Architecture documentation.
- Required AI memory files.
- Company navigation.

## Verified

- `npm run db:generate`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Notes

- Live payment and outstanding testing requires migrations to be applied and company-owned client/trip records to exist.
- Billing, documents, report exports, and richer dashboards are next.
