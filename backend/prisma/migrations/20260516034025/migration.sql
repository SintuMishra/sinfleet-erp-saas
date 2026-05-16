-- DropForeignKey
ALTER TABLE "DriverProfile" DROP CONSTRAINT "DriverProfile_userId_fkey";

-- AlterTable
ALTER TABLE "Vehicle" ALTER COLUMN "vehicleType" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
