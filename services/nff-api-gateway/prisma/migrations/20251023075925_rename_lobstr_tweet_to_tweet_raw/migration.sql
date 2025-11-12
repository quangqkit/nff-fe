/*
  Warnings:

  - You are about to drop the `LobstrTweet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."LobstrTweet" DROP CONSTRAINT "LobstrTweet_runId_fkey";

-- DropTable
DROP TABLE "public"."LobstrTweet";

-- CreateTable
CREATE TABLE "TweetRaw" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "tweetId" TEXT NOT NULL,
    "externalId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'lobstr',
    "authorId" TEXT,
    "authorHandle" TEXT,
    "text" TEXT NOT NULL,
    "language" TEXT DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReply" BOOLEAN NOT NULL DEFAULT false,
    "isRetweet" BOOLEAN NOT NULL DEFAULT false,
    "publicMetrics" JSONB,
    "urls" JSONB,
    "symbols" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rawData" JSONB,

    CONSTRAINT "TweetRaw_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TweetRaw_tweetId_key" ON "TweetRaw"("tweetId");

-- CreateIndex
CREATE INDEX "TweetRaw_tweetId_idx" ON "TweetRaw"("tweetId");

-- CreateIndex
CREATE INDEX "TweetRaw_runId_idx" ON "TweetRaw"("runId");

-- CreateIndex
CREATE INDEX "TweetRaw_createdAt_idx" ON "TweetRaw"("createdAt");

-- CreateIndex
CREATE INDEX "TweetRaw_language_idx" ON "TweetRaw"("language");

-- CreateIndex
CREATE INDEX "TweetRaw_isReply_isRetweet_idx" ON "TweetRaw"("isReply", "isRetweet");

-- CreateIndex
CREATE INDEX "TweetRaw_symbols_idx" ON "TweetRaw"("symbols");

-- CreateIndex
CREATE UNIQUE INDEX "TweetRaw_source_externalId_key" ON "TweetRaw"("source", "externalId");

-- AddForeignKey
ALTER TABLE "TweetRaw" ADD CONSTRAINT "TweetRaw_runId_fkey" FOREIGN KEY ("runId") REFERENCES "LobstrRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
