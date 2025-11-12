-- CreateTable
CREATE TABLE "Catalyst" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "ticker" VARCHAR(20) NOT NULL,
    "reasonTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mergedFromTweetsIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidence" DECIMAL(5,4) NOT NULL,
    "tweetCount" INTEGER NOT NULL DEFAULT 0,
    "timeWindow" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Catalyst_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Catalyst_ticker_idx" ON "Catalyst"("ticker");

-- CreateIndex
CREATE INDEX "Catalyst_reasonTypes_idx" ON "Catalyst"("reasonTypes");

-- CreateIndex
CREATE INDEX "Catalyst_timeWindow_idx" ON "Catalyst"("timeWindow");

-- CreateIndex
CREATE INDEX "Catalyst_confidence_idx" ON "Catalyst"("confidence");
