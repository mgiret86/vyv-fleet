-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "co2Emission" DOUBLE PRECISION,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "imeiPda" TEXT,
ADD COLUMN     "imeiTelematics" TEXT,
ADD COLUMN     "nationalGenre" TEXT,
ADD COLUMN     "seatingCapacity" INTEGER,
ADD COLUMN     "vin" TEXT;
