ALTER TABLE "AiJob" ALTER COLUMN "applicationId" DROP NOT NULL;

ALTER TABLE "AiJob" ADD COLUMN "userId" UUID;
ALTER TABLE "AiJob" ADD COLUMN "retentionUntil" TIMESTAMP(3);

ALTER TABLE "AiJob" ADD CONSTRAINT "AiJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "AiJob_userId_idx" ON "AiJob"("userId");
CREATE INDEX "AiJob_applicationId_idx" ON "AiJob"("applicationId");
