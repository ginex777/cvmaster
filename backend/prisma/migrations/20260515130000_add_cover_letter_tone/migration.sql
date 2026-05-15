-- Store the user's preferred cover-letter tone without regenerating letters.
ALTER TABLE "Application" ADD COLUMN "coverLetterTone" TEXT NOT NULL DEFAULT 'formal';
