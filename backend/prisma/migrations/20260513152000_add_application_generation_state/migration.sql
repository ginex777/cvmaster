ALTER TYPE "AppStatus" ADD VALUE 'FAILED';

ALTER TABLE "Application"
  ADD COLUMN "generationProgress" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "generationError" TEXT;
