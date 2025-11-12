-- CreateTable
CREATE TABLE "IndicatorConfig" (
    "id" SERIAL NOT NULL,
    "indicatorId" VARCHAR(100) NOT NULL,
    "blockId" INTEGER,
    "chartType" VARCHAR(50) NOT NULL DEFAULT 'line',
    "dateRangeStart" TIMESTAMP(3) NOT NULL,
    "dateRangeEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicatorConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IndicatorConfig_indicatorId_idx" ON "IndicatorConfig"("indicatorId");

-- CreateIndex
CREATE INDEX "IndicatorConfig_blockId_idx" ON "IndicatorConfig"("blockId");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorConfig_indicatorId_blockId_key" ON "IndicatorConfig"("indicatorId", "blockId");

-- AddForeignKey
ALTER TABLE "IndicatorConfig" ADD CONSTRAINT "IndicatorConfig_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "ReportBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
