CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TYPE "Plan" AS ENUM ('FREE', 'PAY_PER_APP', 'PRO');
CREATE TYPE "AppStatus" AS ENUM ('DRAFT', 'EXPORTED', 'SENT', 'REPLIED', 'INTERVIEW', 'REJECTED', 'OFFER');

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "email" CITEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'de',
  "plan" "Plan" NOT NULL DEFAULT 'FREE',
  "paddleCustomerId" TEXT,
  "emailVerifiedAt" TIMESTAMP(3),
  "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  "twoFactorSecret" TEXT,
  "trialUsed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "refreshHash" TEXT NOT NULL,
  "userAgent" TEXT NOT NULL,
  "ipHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Consent" (
  "id" UUID NOT NULL,
  "userId" UUID,
  "type" TEXT NOT NULL,
  "granted" BOOLEAN NOT NULL,
  "version" TEXT NOT NULL,
  "ipHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MasterCv" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "parsedJson" JSONB NOT NULL,
  "sourceFilename" TEXT NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "containsArt9" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MasterCv_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobPosting" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceValue" TEXT NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "parsedJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Application" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "masterCvId" UUID NOT NULL,
  "jobPostingId" UUID NOT NULL,
  "status" "AppStatus" NOT NULL DEFAULT 'DRAFT',
  "matchScore" INTEGER,
  "optimizedCv" JSONB,
  "coverLetter" JSONB,
  "chosenVariant" TEXT,
  "chosenLayout" TEXT,
  "matchReport" JSONB,
  "anonymizePhoto" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "exportedAt" TIMESTAMP(3),
  CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiJob" (
  "id" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "modelName" TEXT NOT NULL,
  "response" JSONB,
  "tokensIn" INTEGER,
  "tokensOut" INTEGER,
  "provider" TEXT NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "AiJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" UUID NOT NULL,
  "userId" UUID,
  "event" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailVerification" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordReset" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_refreshHash_key" ON "Session"("refreshHash");
CREATE UNIQUE INDEX "JobPosting_sourceHash_key" ON "JobPosting"("sourceHash");
CREATE UNIQUE INDEX "EmailVerification_userId_key" ON "EmailVerification"("userId");
CREATE UNIQUE INDEX "EmailVerification_token_key" ON "EmailVerification"("token");
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MasterCv" ADD CONSTRAINT "MasterCv_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_masterCvId_fkey" FOREIGN KEY ("masterCvId") REFERENCES "MasterCv"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AiJob" ADD CONSTRAINT "AiJob_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
