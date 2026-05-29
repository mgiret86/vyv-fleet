-- Supprimer l'ancienne contrainte unique sur email
ALTER TABLE "drivers" DROP CONSTRAINT IF EXISTS "drivers_email_key";

-- Créer un index partiel : unicité uniquement sur les conducteurs non supprimés
CREATE UNIQUE INDEX "drivers_email_active_unique"
  ON "drivers" ("email")
  WHERE "deletedAt" IS NULL AND "email" IS NOT NULL;
