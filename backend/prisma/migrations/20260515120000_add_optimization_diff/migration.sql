-- Add optimization diff snapshots for AI-generated CV changes.
ALTER TABLE "Application" ADD COLUMN "optimizationDiff" JSONB;
