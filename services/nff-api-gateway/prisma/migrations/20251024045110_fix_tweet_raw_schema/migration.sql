/*
  Warnings:

  - You are about to drop the column `hashtags` on the `TweetRaw` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `TweetRaw` table. All the data in the column will be lost.
  - You are about to drop the column `mentions` on the `TweetRaw` table. All the data in the column will be lost.
  - You are about to drop the column `rawData` on the `TweetRaw` table. All the data in the column will be lost.
  - Added the required column `scheduleId` to the `TweetRaw` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."TweetRaw" DROP CONSTRAINT "TweetRaw_runId_fkey";

-- DropIndex
DROP INDEX "public"."TweetRaw_language_idx";

-- AlterTable
ALTER TABLE "TweetRaw" DROP COLUMN "hashtags",
DROP COLUMN "language",
DROP COLUMN "mentions",
DROP COLUMN "rawData",
ADD COLUMN     "lang" TEXT DEFAULT 'en',
ADD COLUMN     "scheduleId" TEXT NOT NULL,
ALTER COLUMN "runId" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "TweetRaw_scheduleId_idx" ON "TweetRaw"("scheduleId");

-- CreateIndex
CREATE INDEX "TweetRaw_lang_idx" ON "TweetRaw"("lang");
