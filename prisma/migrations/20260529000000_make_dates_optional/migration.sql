-- AlterTable: rendre les colonnes nullable
ALTER TABLE "vehicles" ALTER COLUMN "insuranceExpiry" DROP NOT NULL;
ALTER TABLE "vehicles" ALTER COLUMN "technicalInspectionExpiry" DROP NOT NULL;
