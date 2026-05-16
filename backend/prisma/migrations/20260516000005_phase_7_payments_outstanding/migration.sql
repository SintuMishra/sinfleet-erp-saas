-- Phase 7: Payment, outstanding, and trip profit reporting.

ALTER TYPE "PaymentMode" ADD VALUE IF NOT EXISTS 'BANK_TRANSFER';
ALTER TYPE "PaymentMode" ADD VALUE IF NOT EXISTS 'CHEQUE';

ALTER TABLE "Trip" ADD COLUMN "receivedAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

UPDATE "Trip"
SET "receivedAmount" = "advanceAmount",
    "balanceAmount" = GREATEST("freightAmount" - "advanceAmount", 0);

ALTER TABLE "Payment" DROP COLUMN IF EXISTS "status";
ALTER TABLE "Payment" DROP COLUMN IF EXISTS "dueDate";
ALTER TABLE "Payment" DROP COLUMN IF EXISTS "paidAt";
ALTER TABLE "Payment" ADD COLUMN "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Payment" ADD COLUMN "paymentMode" "PaymentMode" NOT NULL DEFAULT 'CASH';
ALTER TABLE "Payment" ADD COLUMN "referenceNumber" TEXT;
ALTER TABLE "Payment" ADD COLUMN "notes" TEXT;
ALTER TABLE "Payment" ADD COLUMN "receiptImageUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "Payment"
SET "clientId" = "Trip"."clientId"
FROM "Trip"
WHERE "Payment"."tripId" = "Trip"."id"
  AND "Payment"."clientId" IS NULL;

DELETE FROM "Payment" WHERE "clientId" IS NULL;

ALTER TABLE "Payment" ALTER COLUMN "clientId" SET NOT NULL;

CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");
CREATE INDEX "Payment_paymentMode_idx" ON "Payment"("paymentMode");
CREATE INDEX "Payment_deletedAt_idx" ON "Payment"("deletedAt");
