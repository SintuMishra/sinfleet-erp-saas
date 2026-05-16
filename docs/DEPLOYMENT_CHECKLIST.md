# Deployment Checklist

Date: 2026-05-16

## Preflight

- Confirm `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- Confirm migrations are reviewed and backed up.
- Confirm production secrets are set in the deployment platform.
- Confirm `CORS_ORIGIN` matches production frontend origin.
- Confirm database connection uses managed PostgreSQL with backups.

## Database

- Run Prisma generate during build/deploy.
- Apply migrations in a controlled deployment step.
- Verify `AuditLog` table exists after migration.
- Seed Super Admin with secure env values only.
- Do not run demo seed in production unless it is an isolated demo environment.

## Backend

- Run behind HTTPS reverse proxy/load balancer.
- Configure health checks on `/api/health`.
- Configure structured log collection.
- Configure process manager/container restart policy.
- Confirm graceful shutdown receives SIGTERM.

## Frontend

- Set `NEXT_PUBLIC_API_BASE_URL`.
- Confirm protected routes redirect unauthenticated users.
- Confirm token refresh works after access-token expiry.
- Capture smoke screenshots after deploy.

## Post-Deploy Smoke

- Log in as Super Admin.
- Create or view a company.
- Log in as Company Admin.
- Create a vehicle, trip, diesel entry, expense, and payment.
- Confirm dashboard and reports update.
- Confirm audit logs are created.
- Confirm logout clears session.
