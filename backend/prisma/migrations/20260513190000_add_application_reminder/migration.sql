-- Add reminder fields to Application for pipeline follow-up scheduling
ALTER TABLE "Application" ADD COLUMN "reminderAt" TIMESTAMP(3);
ALTER TABLE "Application" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
