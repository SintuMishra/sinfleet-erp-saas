# Database

Primary database: PostgreSQL.

Prisma schema lives in `backend/prisma/schema.prisma`.

Tenant-owned data must always include `companyId` and backend queries must scope records by authenticated tenant context.
