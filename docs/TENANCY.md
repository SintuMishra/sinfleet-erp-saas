# Tenancy

SinFleet ERP uses company-level tenant isolation. Business data belongs to a `Company` and must include `companyId`.

## Rules

- Super Admin can operate across companies through platform APIs.
- Company Admin can only access data for their `companyId`.
- Driver/User can only access assigned tenant data and permitted workflows.
- Never accept `companyId` from client input when it can be resolved from the authenticated user.
- Use `requireAuth` before protected routes.
- Use `requireTenant` before tenant-owned business routes.
- Use `assertTenantAccess` when a route receives a company id parameter or body field that must match the authenticated tenant.

## Auth Context

Authenticated requests receive:

- `req.user`
- `req.companyId`

Super Admin users have `companyId = null` and may access platform-wide APIs. Company Admin, Driver, and User roles must only read or write data scoped to their own `companyId`.
