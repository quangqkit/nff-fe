/*
  Warnings:

  - You are about to drop the column `hashtags` on the `TweetRaw` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `TweetRaw` table. All the data in the column will be lost.
  - You are about to drop the column `mentions` on the `TweetRaw` table. All the data in the column will be lost.
  - You are about to drop the column `rawData` on the `TweetRaw` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TweetRaw" DROP CONSTRAINT "TweetRaw_runId_fkey";

-- DropIndex
DROP INDEX "public"."TweetRaw_language_idx";

-- Prepare new columns for data migration
ALTER TABLE "TweetRaw"
ADD COLUMN     "lang" TEXT DEFAULT 'en',
ADD COLUMN     "scheduleId" TEXT,
ADD COLUMN     "runId_new" TEXT;

-- Populate new relation columns using existing FK relationships
UPDATE "TweetRaw" tr
SET "runId_new" = lr."runId",
    "scheduleId" = ls."scheduleId"
FROM "LobstrRun" lr
JOIN "LobstrSchedule" ls ON lr."scheduleId" = ls."id"
WHERE tr."runId" = lr."id";

-- Ensure all existing rows received the required data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "TweetRaw" WHERE "runId_new" IS NULL OR "scheduleId" IS NULL) THEN
    RAISE EXCEPTION 'TweetRaw migration failed: missing runId or scheduleId for existing rows';
  END IF;
END
$$;

-- Remove deprecated columns and replace runId with the new text variant
ALTER TABLE "TweetRaw"
DROP COLUMN "hashtags",
DROP COLUMN "language",
DROP COLUMN "mentions",
DROP COLUMN "rawData",
DROP COLUMN "runId";

ALTER TABLE "TweetRaw"
RENAME COLUMN "runId_new" TO "runId";

ALTER TABLE "TweetRaw"
ALTER COLUMN "runId" SET NOT NULL,
ALTER COLUMN "scheduleId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "TweetRaw_scheduleId_idx" ON "TweetRaw"("scheduleId");

-- CreateIndex
CREATE INDEX "TweetRaw_lang_idx" ON "TweetRaw"("lang");
