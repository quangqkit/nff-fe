-- CreateTable
CREATE TABLE "public"."MacroIndicatorConfig" (
    "id" SERIAL NOT NULL,
    "blockId" INTEGER,
    "indicatorId" VARCHAR(50) NOT NULL,
    "chartType" TEXT NOT NULL DEFAULT 'line',
    "dateRangeStart" TIMESTAMP(3) NOT NULL,
    "dateRangeEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacroIndicatorConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MacroIndicatorConfig_blockId_indicatorId_key" ON "public"."MacroIndicatorConfig"("blockId", "indicatorId");

-- AddForeignKey
ALTER TABLE "public"."MacroIndicatorConfig" ADD CONSTRAINT "MacroIndicatorConfig_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "public"."ReportBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
