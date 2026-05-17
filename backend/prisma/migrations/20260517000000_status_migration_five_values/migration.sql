-- BE-01: Migrate legacy AppStatus values to the 5 canonical new values
-- Mapping:
--   OPEN  + exportedAt IS NOT NULL → APPLIED
--   OPEN  + exportedAt IS NULL     → DRAFT
--   DONE                            → APPLIED
--   EXPORTED, SENT                  → APPLIED
--   REPLIED                         → INTERVIEW
--   FAILED                          → REJECTED
--   DRAFT, INTERVIEW, OFFER, REJECTED → pass-through (already valid)

-- Step 1: Data migration
UPDATE "Application" SET "status" = 'APPLIED'::"AppStatus"
  WHERE "status" = 'DONE'::"AppStatus";

UPDATE "Application" SET "status" = 'APPLIED'::"AppStatus"
  WHERE "status" IN ('EXPORTED'::"AppStatus", 'SENT'::"AppStatus");

UPDATE "Application" SET "status" = 'INTERVIEW'::"AppStatus"
  WHERE "status" = 'REPLIED'::"AppStatus";

UPDATE "Application" SET "status" = 'REJECTED'::"AppStatus"
  WHERE "status" = 'FAILED'::"AppStatus";

UPDATE "Application" SET "status" = 'APPLIED'::"AppStatus"
  WHERE "status" = 'OPEN'::"AppStatus" AND "exportedAt" IS NOT NULL;

UPDATE "Application" SET "status" = 'DRAFT'::"AppStatus"
  WHERE "status" = 'OPEN'::"AppStatus" AND "exportedAt" IS NULL;

-- Step 2: Create new enum with only the 5 canonical values
CREATE TYPE "AppStatus_new" AS ENUM ('DRAFT', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED');

-- Step 3: Migrate the column to the new enum type
ALTER TABLE "Application"
  ALTER COLUMN "status" TYPE "AppStatus_new"
  USING "status"::text::"AppStatus_new";

-- Step 4: Swap enum names
DROP TYPE "AppStatus";
ALTER TYPE "AppStatus_new" RENAME TO "AppStatus";
