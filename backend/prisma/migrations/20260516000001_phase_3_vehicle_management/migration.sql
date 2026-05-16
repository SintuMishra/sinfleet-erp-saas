-- Phase 3 vehicle management enums
CREATE TYPE "VehicleType" AS ENUM ('TRUCK_10_WHEEL', 'TRUCK_12_WHEEL', 'TRUCK_14_WHEEL', 'TRAILER', 'SIGNATURE_SIGNA', 'OTHER');
CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'CNG', 'PETROL', 'ELECTRIC', 'OTHER');
CREATE TYPE "OwnershipType" AS ENUM ('OWNED', 'ATTACHED', 'RENTED');
CREATE TYPE "VehicleStatus_new" AS ENUM ('ACTIVE', 'IDLE', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE');

-- Vehicle field expansion. Defaults keep migration safe for existing rows.
ALTER TABLE "Vehicle" ADD COLUMN "make" TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE "Vehicle" ADD COLUMN "manufacturingYear" INTEGER NOT NULL DEFAULT 2026;
ALTER TABLE "Vehicle" ADD COLUMN "fuelType" "FuelType" NOT NULL DEFAULT 'DIESEL';
ALTER TABLE "Vehicle" ADD COLUMN "ownershipType" "OwnershipType" NOT NULL DEFAULT 'OWNED';
ALTER TABLE "Vehicle" ADD COLUMN "capacityTon" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "Vehicle" ADD COLUMN "rcNumber" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Vehicle" ADD COLUMN "insuranceExpiryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Vehicle" ADD COLUMN "fitnessExpiryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Vehicle" ADD COLUMN "permitExpiryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Vehicle" ADD COLUMN "pollutionExpiryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Vehicle" ADD COLUMN "gpsDeviceId" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "notes" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Preserve existing free-text vehicle types as OTHER for the new enum.
ALTER TABLE "Vehicle" ADD COLUMN "vehicleType_new" "VehicleType" NOT NULL DEFAULT 'OTHER';
ALTER TABLE "Vehicle" DROP COLUMN "vehicleType";
ALTER TABLE "Vehicle" RENAME COLUMN "vehicleType_new" TO "vehicleType";

-- Preserve old brand data as make, then remove the legacy field.
UPDATE "Vehicle" SET "make" = COALESCE("brand", "make") WHERE "brand" IS NOT NULL;
ALTER TABLE "Vehicle" DROP COLUMN "brand";
ALTER TABLE "Vehicle" ALTER COLUMN "model" SET DEFAULT 'Unknown';
UPDATE "Vehicle" SET "model" = 'Unknown' WHERE "model" IS NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "model" SET NOT NULL;

-- Replace old vehicle status enum safely.
ALTER TABLE "Vehicle" ADD COLUMN "status_new" "VehicleStatus_new" NOT NULL DEFAULT 'ACTIVE';
UPDATE "Vehicle"
SET "status_new" = CASE
  WHEN "status"::text = 'ACTIVE' THEN 'ACTIVE'::"VehicleStatus_new"
  WHEN "status"::text = 'IN_MAINTENANCE' THEN 'MAINTENANCE'::"VehicleStatus_new"
  WHEN "status"::text = 'INACTIVE' THEN 'INACTIVE'::"VehicleStatus_new"
  ELSE 'ACTIVE'::"VehicleStatus_new"
END;
ALTER TABLE "Vehicle" DROP COLUMN "status";
ALTER TABLE "Vehicle" RENAME COLUMN "status_new" TO "status";
DROP TYPE "VehicleStatus";
ALTER TYPE "VehicleStatus_new" RENAME TO "VehicleStatus";

-- Remove transitional defaults so application validation owns required values.
ALTER TABLE "Vehicle" ALTER COLUMN "make" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "model" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "manufacturingYear" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "fuelType" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "ownershipType" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "capacityTon" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "rcNumber" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "insuranceExpiryDate" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "fitnessExpiryDate" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "permitExpiryDate" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "pollutionExpiryDate" DROP DEFAULT;

CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");
CREATE INDEX "Vehicle_vehicleType_idx" ON "Vehicle"("vehicleType");
CREATE INDEX "Vehicle_deletedAt_idx" ON "Vehicle"("deletedAt");
