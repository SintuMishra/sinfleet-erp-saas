-- Phase 5 trip management enums
CREATE TYPE "QuantityUnit" AS ENUM ('TON', 'KG', 'CFT', 'BAG', 'PIECE', 'OTHER');
CREATE TYPE "RateType" AS ENUM ('FIXED', 'PER_TON', 'PER_KM', 'PER_CFT', 'OTHER');
CREATE TYPE "TripStatus_new" AS ENUM ('BOOKED', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'BILLED', 'PAID');

-- Trip expansion. Defaults keep migration safe for existing rows.
ALTER TABLE "Trip" ADD COLUMN "tripNumber" TEXT NOT NULL DEFAULT 'TRIP-LEGACY';
UPDATE "Trip" SET "tripNumber" = 'TRIP-LEGACY-' || "id";
ALTER TABLE "Trip" ADD COLUMN "sourceLocation" TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE "Trip" ADD COLUMN "destinationLocation" TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE "Trip" ADD COLUMN "loadingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Trip" ADD COLUMN "unloadingDate" TIMESTAMP(3);
ALTER TABLE "Trip" ADD COLUMN "materialName" TEXT;
ALTER TABLE "Trip" ADD COLUMN "quantity" DECIMAL(65,30);
ALTER TABLE "Trip" ADD COLUMN "quantityUnit" "QuantityUnit" NOT NULL DEFAULT 'TON';
ALTER TABLE "Trip" ADD COLUMN "advanceAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "Trip" ADD COLUMN "balanceAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "Trip" ADD COLUMN "rateType" "RateType" NOT NULL DEFAULT 'FIXED';
ALTER TABLE "Trip" ADD COLUMN "distanceKm" DECIMAL(65,30);
ALTER TABLE "Trip" ADD COLUMN "notes" TEXT;
ALTER TABLE "Trip" ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "Trip"
SET
  "sourceLocation" = COALESCE("origin", "sourceLocation"),
  "destinationLocation" = COALESCE("destination", "destinationLocation"),
  "loadingDate" = COALESCE("startDate", "loadingDate"),
  "unloadingDate" = "endDate",
  "balanceAmount" = "freightAmount";

ALTER TABLE "Trip" DROP COLUMN "origin";
ALTER TABLE "Trip" DROP COLUMN "destination";
ALTER TABLE "Trip" DROP COLUMN "startDate";
ALTER TABLE "Trip" DROP COLUMN "endDate";

ALTER TABLE "Trip" ADD COLUMN "status_new" "TripStatus_new" NOT NULL DEFAULT 'BOOKED';
UPDATE "Trip"
SET "status_new" = CASE
  WHEN "status"::text = 'PLANNED' THEN 'BOOKED'::"TripStatus_new"
  WHEN "status"::text = 'RUNNING' THEN 'IN_TRANSIT'::"TripStatus_new"
  WHEN "status"::text = 'COMPLETED' THEN 'DELIVERED'::"TripStatus_new"
  WHEN "status"::text = 'CANCELLED' THEN 'CANCELLED'::"TripStatus_new"
  ELSE 'BOOKED'::"TripStatus_new"
END;
ALTER TABLE "Trip" DROP COLUMN "status";
ALTER TABLE "Trip" RENAME COLUMN "status_new" TO "status";
DROP TYPE "TripStatus";
ALTER TYPE "TripStatus_new" RENAME TO "TripStatus";

ALTER TABLE "Trip" ALTER COLUMN "driverId" SET NOT NULL;
ALTER TABLE "Trip" ALTER COLUMN "clientId" SET NOT NULL;
ALTER TABLE "Trip" ALTER COLUMN "tripNumber" DROP DEFAULT;
ALTER TABLE "Trip" ALTER COLUMN "sourceLocation" DROP DEFAULT;
ALTER TABLE "Trip" ALTER COLUMN "destinationLocation" DROP DEFAULT;
ALTER TABLE "Trip" ALTER COLUMN "loadingDate" DROP DEFAULT;

CREATE UNIQUE INDEX "Trip_companyId_tripNumber_key" ON "Trip"("companyId", "tripNumber");
CREATE INDEX "Trip_tripNumber_idx" ON "Trip"("tripNumber");
CREATE INDEX "Trip_clientId_idx" ON "Trip"("clientId");
CREATE INDEX "Trip_status_idx" ON "Trip"("status");
CREATE INDEX "Trip_loadingDate_idx" ON "Trip"("loadingDate");
CREATE INDEX "Trip_deletedAt_idx" ON "Trip"("deletedAt");
