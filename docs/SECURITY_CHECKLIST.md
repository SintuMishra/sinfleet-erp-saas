# Security Checklist

Date: 2026-05-16

## Environment

- Use strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values.
- Keep `.env` files out of Git.
- Set exact `CORS_ORIGIN` values; use comma-separated origins only when required.
- Rotate demo passwords before client demos.
- Never commit real customer data or production credentials.

## Authentication

- Verify auth rate limiting on login, refresh, and logout.
- Verify refresh token rotation.
- Verify logout revokes refresh tokens.
- Verify inactive users cannot authenticate.
- Verify frontend clears tokens on session expiry.

## Authorization

- Confirm `/api/admin/*` requires `SUPER_ADMIN`.
- Confirm `/api/company/*` requires `COMPANY_ADMIN` or `USER`.
- Confirm tenant-owned queries always use authenticated `companyId`.
- Confirm Super Admin cannot accidentally access tenant CRUD without explicit future impersonation.

## Input And Output

- Confirm Zod validation errors are clear and do not leak internals.
- Confirm request bodies are trimmed and prototype pollution keys are dropped.
- Confirm secrets are redacted from logs and audit metadata.
- Confirm errors include request id but not stack traces in production.

## Transport And Headers

- Confirm Helmet security headers are active.
- Use HTTPS in production.
- Configure reverse proxy and trusted origins before deployment.
- Restrict production database access to app/network only.

## Audit And Monitoring

- Confirm critical mutations write audit logs.
- Confirm logs include request id, status, method, path, duration, user id, and company id.
- Confirm logs do not include tokens, password hashes, or raw credentials.
