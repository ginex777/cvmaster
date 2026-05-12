DROP INDEX IF EXISTS "JobPosting_sourceHash_key";

CREATE UNIQUE INDEX IF NOT EXISTS "JobPosting_userId_sourceHash_key" ON "JobPosting"("userId", "sourceHash");
