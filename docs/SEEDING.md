# Seeding

SinFleet ERP uses a secure seed flow to create the first platform-level Super Admin for SinSoftware Solutions.

## Required Environment Variables

Set these values in `backend/.env` or your deployment environment before seeding:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sinfleet_erp_db?schema=public
SUPER_ADMIN_NAME="SinSoftware Super Admin"
SUPER_ADMIN_EMAIL=admin@sinsoftware.in
SUPER_ADMIN_PASSWORD=replace-with-a-strong-password
BCRYPT_SALT_ROUNDS=12
```

Do not use the placeholder password from `.env.example`.

## Commands

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed is idempotent by email. Running it again updates the Super Admin name, password, role, and active status.

## Login

After seeding, call:

```bash
POST /api/auth/login
```

Body:

```json
{
  "email": "admin@sinsoftware.in",
  "password": "replace-with-a-strong-password"
}
```

Then open the Super Admin panel:

```bash
http://localhost:3000/admin/login
```
