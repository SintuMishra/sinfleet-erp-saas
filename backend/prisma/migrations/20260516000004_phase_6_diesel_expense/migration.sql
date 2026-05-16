-- Phase 6: Diesel and expense management.

DO $$ BEGIN
  CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'UPI', 'CARD', 'CREDIT', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "ExpenseType" ADD VALUE IF NOT EXISTS 'CHALLAN';
ALTER TYPE "ExpenseType" ADD VALUE IF NOT EXISTS 'LOADING';
ALTER TYPE "ExpenseType" ADD VALUE IF NOT EXISTS 'UNLOADING';
ALTER TYPE "ExpenseType" ADD VALUE IF NOT EXISTS 'DRIVER_ADVANCE';
ALTER TYPE "ExpenseType" ADD VALUE IF NOT EXISTS 'HELPER';
ALTER TYPE "ExpenseType" ADD VALUE IF NOT EXISTS 'PARKING';
ALTER TYPE "ExpenseType" ADD VALUE IF NOT EXISTS 'TYRE';
ALTER TYPE "ExpenseType" ADD VALUE IF NOT EXISTS 'MAINTENANCE';

CREATE TABLE "Diesel" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "tripId" TEXT,
  "vehicleId" TEXT NOT NULL,
  "driverId" TEXT,
  "dieselDate" TIMESTAMP(3) NOT NULL,
  "fuelStationName" TEXT,
  "liters" DECIMAL(65,30) NOT NULL,
  "ratePerLiter" DECIMAL(65,30) NOT NULL,
  "totalAmount" DECIMAL(65,30) NOT NULL,
  "paymentMode" "PaymentMode" NOT NULL,
  "billNumber" TEXT,
  "odometerReading" INTEGER,
  "notes" TEXT,
  "receiptImageUrl" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Diesel_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Expense" RENAME COLUMN "type" TO "expenseType";
ALTER TABLE "Expense" RENAME COLUMN "receiptUrl" TO "receiptImageUrl";
ALTER TABLE "Expense" ADD COLUMN "vehicleId" TEXT;
ALTER TABLE "Expense" ADD COLUMN "driverId" TEXT;
ALTER TABLE "Expense" ADD COLUMN "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Expense" ADD COLUMN "paymentMode" "PaymentMode" NOT NULL DEFAULT 'CASH';
ALTER TABLE "Expense" ADD COLUMN "paidTo" TEXT;
ALTER TABLE "Expense" ADD COLUMN "billNumber" TEXT;
ALTER TABLE "Expense" ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "Expense"
SET "expenseType" = 'OTHER'
WHERE "expenseType"::text IN ('DIESEL', 'SALARY');

CREATE INDEX "Diesel_companyId_idx" ON "Diesel"("companyId");
CREATE INDEX "Diesel_tripId_idx" ON "Diesel"("tripId");
CREATE INDEX "Diesel_vehicleId_idx" ON "Diesel"("vehicleId");
CREATE INDEX "Diesel_driverId_idx" ON "Diesel"("driverId");
CREATE INDEX "Diesel_dieselDate_idx" ON "Diesel"("dieselDate");
CREATE INDEX "Diesel_deletedAt_idx" ON "Diesel"("deletedAt");

CREATE INDEX "Expense_vehicleId_idx" ON "Expense"("vehicleId");
CREATE INDEX "Expense_driverId_idx" ON "Expense"("driverId");
CREATE INDEX "Expense_expenseType_idx" ON "Expense"("expenseType");
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");
CREATE INDEX "Expense_deletedAt_idx" ON "Expense"("deletedAt");

ALTER TABLE "Diesel" ADD CONSTRAINT "Diesel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Diesel" ADD CONSTRAINT "Diesel_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Diesel" ADD CONSTRAINT "Diesel_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Diesel" ADD CONSTRAINT "Diesel_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
