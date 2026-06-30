-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "entryDate" TIMESTAMP(3),
ADD COLUMN     "exitDate" TIMESTAMP(3),
ADD COLUMN     "firstRegistrationDate" TIMESTAMP(3),
ADD COLUMN     "taxiMeterControlExpiry" TIMESTAMP(3);
