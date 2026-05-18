-- BE-01: Migrate legacy AppStatus values to the 5 canonical new values
-- Mapping:
--   OPEN  + exportedAt IS NOT NULL → APPLIED
--   OPEN  + exportedAt IS NULL     → DRAFT
--   DONE                            → APPLIED
--   EXPORTED, SENT                  → APPLIED
--   REPLIED                         → INTERVIEW
--   FAILED                          → REJECTED
--   DRAFT, INTERVIEW, OFFER, REJECTED → pass-through (already valid)

-- Step 1: Create new enum with only the 5 canonical values
CREATE TYPE "AppStatus_new" AS ENUM ('DRAFT', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED');

-- Step 2: Migrate and normalize the column in one cast. PostgreSQL cannot write
-- new enum values such as APPLIED into the old AppStatus type before the swap.
ALTER TABLE "Application"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "AppStatus_new"
  USING (
    CASE
      WHEN "status"::text = 'OPEN' AND "exportedAt" IS NULL THEN 'DRAFT'
      WHEN "status"::text IN ('OPEN', 'DONE', 'EXPORTED', 'SENT') THEN 'APPLIED'
      WHEN "status"::text = 'REPLIED' THEN 'INTERVIEW'
      WHEN "status"::text = 'FAILED' THEN 'REJECTED'
      ELSE "status"::text
    END
  )::"AppStatus_new",
  ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"AppStatus_new";

-- Step 3: Swap enum names
DROP TYPE "AppStatus";
ALTER TYPE "AppStatus_new" RENAME TO "AppStatus";
