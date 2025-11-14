-- CreateEnum
CREATE TYPE "public"."StoryType" AS ENUM ('TICKER', 'SECTOR');

-- CreateEnum
CREATE TYPE "public"."StoryStatus" AS ENUM ('PENDING', 'GROUPED', 'COMPOSED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "public"."Story" (
    "id" SERIAL NOT NULL,
    "type" "public"."StoryType" NOT NULL,
    "ticker" TEXT,
    "sector" TEXT,
    "runId" TEXT,
    "scheduleId" TEXT,
    "status" "public"."StoryStatus" NOT NULL DEFAULT 'PENDING',
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "composedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StoryTickerItem" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "tweetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryTickerItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StorySectorItem" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "tweetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorySectorItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Story_type_idx" ON "public"."Story"("type");

-- CreateIndex
CREATE INDEX "Story_ticker_idx" ON "public"."Story"("ticker");

-- CreateIndex
CREATE INDEX "Story_sector_idx" ON "public"."Story"("sector");

-- CreateIndex
CREATE INDEX "Story_status_idx" ON "public"."Story"("status");

-- CreateIndex
CREATE INDEX "Story_runId_idx" ON "public"."Story"("runId");

-- CreateIndex
CREATE INDEX "Story_scheduleId_idx" ON "public"."Story"("scheduleId");

-- CreateIndex
CREATE INDEX "Story_createdAt_idx" ON "public"."Story"("createdAt");

-- CreateIndex
CREATE INDEX "StoryTickerItem_storyId_idx" ON "public"."StoryTickerItem"("storyId");

-- CreateIndex
CREATE INDEX "StoryTickerItem_tweetId_idx" ON "public"."StoryTickerItem"("tweetId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryTickerItem_storyId_tweetId_key" ON "public"."StoryTickerItem"("storyId", "tweetId");

-- CreateIndex
CREATE INDEX "StorySectorItem_storyId_idx" ON "public"."StorySectorItem"("storyId");

-- CreateIndex
CREATE INDEX "StorySectorItem_tweetId_idx" ON "public"."StorySectorItem"("tweetId");

-- CreateIndex
CREATE UNIQUE INDEX "StorySectorItem_storyId_tweetId_key" ON "public"."StorySectorItem"("storyId", "tweetId");

-- AddForeignKey
ALTER TABLE "public"."StoryTickerItem" ADD CONSTRAINT "StoryTickerItem_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "public"."Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StoryTickerItem" ADD CONSTRAINT "StoryTickerItem_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "public"."Tweet"("tweetId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StorySectorItem" ADD CONSTRAINT "StorySectorItem_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "public"."Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StorySectorItem" ADD CONSTRAINT "StorySectorItem_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "public"."Tweet"("tweetId") ON DELETE CASCADE ON UPDATE CASCADE;
