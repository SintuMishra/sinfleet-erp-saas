/*
  Warnings:

  - The values [DIESEL,SALARY] on the enum `ExpenseType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExpenseType_new" AS ENUM ('TOLL', 'REPAIR', 'CHALLAN', 'LOADING', 'UNLOADING', 'DRIVER_ADVANCE', 'HELPER', 'FOOD', 'PARKING', 'TYRE', 'MAINTENANCE', 'OTHER');
ALTER TABLE "Expense" ALTER COLUMN "expenseType" TYPE "ExpenseType_new" USING ("expenseType"::text::"ExpenseType_new");
ALTER TYPE "ExpenseType" RENAME TO "ExpenseType_old";
ALTER TYPE "ExpenseType_new" RENAME TO "ExpenseType";
DROP TYPE "public"."ExpenseType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_driverId_fkey";

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "expenseDate" DROP DEFAULT,
ALTER COLUMN "paymentMode" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "paymentDate" DROP DEFAULT,
ALTER COLUMN "paymentMode" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
