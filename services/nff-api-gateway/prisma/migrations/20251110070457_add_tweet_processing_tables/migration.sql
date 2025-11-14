/*
  Warnings:

  - A unique constraint covering the columns `[source,externalId]` on the table `TweetRaw` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."TweetProcessingStatus" AS ENUM ('PENDING', 'NORMALIZING', 'CLASSIFYING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."TweetProcessingStage" AS ENUM ('NORMALIZATION', 'CLASSIFICATION');

-- CreateEnum
CREATE TYPE "public"."TweetCategory" AS ENUM ('MACRO', 'SECTOR', 'EARNINGS', 'ANALYST', 'CORPORATE_REGULATORY', 'FLOWS_OPTIONS');

-- CreateTable
CREATE TABLE "public"."TweetProcessingJob" (
    "jobId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "downloadUrl" TEXT NOT NULL,
    "status" "public"."TweetProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "stage" "public"."TweetProcessingStage",
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "discardedCount" INTEGER NOT NULL DEFAULT 0,
    "error" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TweetProcessingJob_pkey" PRIMARY KEY ("jobId")
);

-- CreateTable
CREATE TABLE "public"."TweetClassification" (
    "id" SERIAL NOT NULL,
    "tweetId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "category" "public"."TweetCategory" NOT NULL,
    "tickers" TEXT[],
    "sectors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TweetClassification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TweetProcessingJob_runId_idx" ON "public"."TweetProcessingJob"("runId");

-- CreateIndex
CREATE INDEX "TweetProcessingJob_scheduleId_idx" ON "public"."TweetProcessingJob"("scheduleId");

-- CreateIndex
CREATE INDEX "TweetProcessingJob_status_idx" ON "public"."TweetProcessingJob"("status");

-- CreateIndex
CREATE INDEX "TweetProcessingJob_stage_idx" ON "public"."TweetProcessingJob"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "TweetClassification_tweetId_key" ON "public"."TweetClassification"("tweetId");

-- CreateIndex
CREATE INDEX "TweetClassification_runId_idx" ON "public"."TweetClassification"("runId");

-- CreateIndex
CREATE INDEX "TweetClassification_scheduleId_idx" ON "public"."TweetClassification"("scheduleId");

-- CreateIndex
CREATE INDEX "TweetClassification_category_idx" ON "public"."TweetClassification"("category");

-- CreateIndex
CREATE UNIQUE INDEX "TweetRaw_source_externalId_key" ON "public"."TweetRaw"("source", "externalId");

-- AddForeignKey
ALTER TABLE "public"."TweetClassification" ADD CONSTRAINT "TweetClassification_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "public"."TweetRaw"("tweetId") ON DELETE CASCADE ON UPDATE CASCADE;
