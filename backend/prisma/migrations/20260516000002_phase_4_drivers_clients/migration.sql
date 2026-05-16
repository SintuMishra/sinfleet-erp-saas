-- Phase 4 driver and client management enums
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'ON_TRIP', 'INACTIVE', 'BLACKLISTED');
CREATE TYPE "SalaryType" AS ENUM ('FIXED', 'PER_TRIP', 'COMMISSION', 'NONE');
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- DriverProfile expansion. Defaults keep migration safe for existing rows.
ALTER TABLE "DriverProfile" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Driver';
ALTER TABLE "DriverProfile" ADD COLUMN "phone" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "DriverProfile" ADD COLUMN "alternatePhone" TEXT;
ALTER TABLE "DriverProfile" ALTER COLUMN "licenseNumber" SET DEFAULT 'PENDING';
UPDATE "DriverProfile" SET "licenseNumber" = 'PENDING-' || "id" WHERE "licenseNumber" IS NULL;
ALTER TABLE "DriverProfile" ALTER COLUMN "licenseNumber" SET NOT NULL;
ALTER TABLE "DriverProfile" ADD COLUMN "licenseExpiryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "DriverProfile" ADD COLUMN "aadhaarNumber" TEXT;
ALTER TABLE "DriverProfile" ADD COLUMN "address" TEXT;
ALTER TABLE "DriverProfile" ADD COLUMN "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "DriverProfile" ADD COLUMN "salaryType" "SalaryType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "DriverProfile" ADD COLUMN "salaryAmount" DECIMAL(65,30);
ALTER TABLE "DriverProfile" ADD COLUMN "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "DriverProfile" ADD COLUMN "notes" TEXT;
ALTER TABLE "DriverProfile" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "DriverProfile" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "DriverProfile" DROP COLUMN "emergencyPhone";
ALTER TABLE "DriverProfile" ALTER COLUMN "name" DROP DEFAULT;
ALTER TABLE "DriverProfile" ALTER COLUMN "phone" DROP DEFAULT;
ALTER TABLE "DriverProfile" ALTER COLUMN "licenseNumber" DROP DEFAULT;
ALTER TABLE "DriverProfile" ALTER COLUMN "licenseExpiryDate" DROP DEFAULT;
ALTER TABLE "DriverProfile" ALTER COLUMN "joiningDate" DROP DEFAULT;

-- Client expansion. Defaults keep migration safe for existing rows.
ALTER TABLE "Client" RENAME COLUMN "name" TO "clientName";
ALTER TABLE "Client" RENAME COLUMN "address" TO "billingAddress";
ALTER TABLE "Client" ADD COLUMN "contactPerson" TEXT;
ALTER TABLE "Client" ADD COLUMN "alternatePhone" TEXT;
ALTER TABLE "Client" ADD COLUMN "city" TEXT;
ALTER TABLE "Client" ADD COLUMN "state" TEXT;
ALTER TABLE "Client" ADD COLUMN "paymentTerms" TEXT;
ALTER TABLE "Client" ADD COLUMN "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Client" ADD COLUMN "notes" TEXT;
ALTER TABLE "Client" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Indexes and uniqueness
CREATE UNIQUE INDEX "DriverProfile_companyId_phone_key" ON "DriverProfile"("companyId", "phone");
CREATE UNIQUE INDEX "DriverProfile_companyId_licenseNumber_key" ON "DriverProfile"("companyId", "licenseNumber");
CREATE INDEX "DriverProfile_status_idx" ON "DriverProfile"("status");
CREATE INDEX "DriverProfile_deletedAt_idx" ON "DriverProfile"("deletedAt");

CREATE UNIQUE INDEX "Client_companyId_phone_key" ON "Client"("companyId", "phone");
CREATE UNIQUE INDEX "Client_companyId_gstNumber_key" ON "Client"("companyId", "gstNumber");
CREATE INDEX "Client_status_idx" ON "Client"("status");
CREATE INDEX "Client_deletedAt_idx" ON "Client"("deletedAt");
