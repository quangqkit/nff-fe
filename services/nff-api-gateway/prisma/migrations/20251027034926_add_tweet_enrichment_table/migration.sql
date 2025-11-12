-- DropIndex
DROP INDEX "public"."TweetRaw_source_externalId_key";

-- CreateTable
CREATE TABLE "TweetEnrichment" (
    "id" SERIAL NOT NULL,
    "tweetId" TEXT NOT NULL,
    "aiSummary" TEXT,
    "aiLabels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiConfidence" DECIMAL(5,4),
    "sentiment" VARCHAR(20),
    "topic" VARCHAR(100),
    "tickerCandidates" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "moverFlag" BOOLEAN NOT NULL DEFAULT false,
    "reasonTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TweetEnrichment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TweetEnrichment_tweetId_key" ON "TweetEnrichment"("tweetId");

-- CreateIndex
CREATE INDEX "TweetEnrichment_tweetId_idx" ON "TweetEnrichment"("tweetId");

-- CreateIndex
CREATE INDEX "TweetEnrichment_moverFlag_idx" ON "TweetEnrichment"("moverFlag");

-- CreateIndex
CREATE INDEX "TweetEnrichment_reasonTypes_idx" ON "TweetEnrichment"("reasonTypes");

-- CreateIndex
CREATE INDEX "TweetEnrichment_sentiment_idx" ON "TweetEnrichment"("sentiment");

-- CreateIndex
CREATE INDEX "TweetEnrichment_processedAt_idx" ON "TweetEnrichment"("processedAt");
