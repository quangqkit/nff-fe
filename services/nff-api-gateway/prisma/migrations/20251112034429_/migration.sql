-- CreateTable
CREATE TABLE "public"."Tweet" (
    "id" SERIAL NOT NULL,
    "tweetId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tickers" TEXT[],
    "sectors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tweet_tweetId_key" ON "public"."Tweet"("tweetId");

-- CreateIndex
CREATE INDEX "Tweet_category_idx" ON "public"."Tweet"("category");

-- CreateIndex
CREATE INDEX "Tweet_createdAt_idx" ON "public"."Tweet"("createdAt");

-- CreateIndex
CREATE INDEX "Tweet_updatedAt_idx" ON "public"."Tweet"("updatedAt");
