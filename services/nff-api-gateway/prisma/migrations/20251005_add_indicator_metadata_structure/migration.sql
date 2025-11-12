-- CreateEnum
CREATE TYPE "ETLStatus" AS ENUM ('UNKNOWN', 'PENDING', 'PROCESSING', 'OK', 'ERROR', 'BLOCKED', 'STALE');

-- CreateEnum
CREATE TYPE "ETLJobStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "IndicatorMetadata" (
    "id" SERIAL NOT NULL,
    "moduleEN" VARCHAR(100) NOT NULL,
    "moduleHE" VARCHAR(100),
    "indicatorEN" VARCHAR(200) NOT NULL,
    "indicatorHE" VARCHAR(200),
    "categoryId" INTEGER NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "seriesIDs" TEXT,
    "apiExample" TEXT,
    "calculation" TEXT,
    "notes" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 3,
    "relevantReports" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultChartType" VARCHAR(255) NOT NULL DEFAULT 'line',
    "etlStatus" "ETLStatus" NOT NULL DEFAULT 'UNKNOWN',
    "etlStatusCode" VARCHAR(50),
    "etlNotes" TEXT,
    "lastEtlRunAt" TIMESTAMP(3),
    "lastSuccessfulAt" TIMESTAMP(3),
    "recordsCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicatorMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorTimeSeries" (
    "id" SERIAL NOT NULL,
    "indicatorMetadataId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "value" DECIMAL(15,6),
    "zScore" DECIMAL(8,4),
    "normalized" DECIMAL(8,6),
    "pctChange1m" DECIMAL(10,4),
    "pctChange3m" DECIMAL(10,4),
    "pctChange12m" DECIMAL(10,4),
    "ma30d" DECIMAL(15,6),
    "ma90d" DECIMAL(15,6),
    "ma365d" DECIMAL(15,6),
    "volatility30d" DECIMAL(15,6),
    "volatility90d" DECIMAL(15,6),
    "lag1" DECIMAL(15,6),
    "lag3" DECIMAL(15,6),
    "lag6" DECIMAL(15,6),
    "lag12" DECIMAL(15,6),
    "trend" VARCHAR(10),
    "isOutlier" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicatorTimeSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorReportDefault" (
    "id" SERIAL NOT NULL,
    "indicatorId" INTEGER NOT NULL,
    "reportTypeId" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicatorReportDefault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorETLLog" (
    "id" SERIAL NOT NULL,
    "indicatorId" INTEGER NOT NULL,
    "jobId" VARCHAR(100) NOT NULL,
    "status" "ETLStatus" NOT NULL,
    "errorCode" VARCHAR(50),
    "errorMessage" TEXT,
    "errorCategory" VARCHAR(50),
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsInserted" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "IndicatorETLLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ETLJob" (
    "jobId" VARCHAR(50) NOT NULL,
    "status" "ETLJobStatus" NOT NULL,
    "totalIndicators" INTEGER NOT NULL,
    "successful" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "blocked" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ETLJob_pkey" PRIMARY KEY ("jobId")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorMetadata_indicatorEN_categoryId_key" ON "IndicatorMetadata"("indicatorEN", "categoryId");

-- CreateIndex
CREATE INDEX "IndicatorMetadata_categoryId_idx" ON "IndicatorMetadata"("categoryId");

-- CreateIndex
CREATE INDEX "IndicatorMetadata_etlStatus_idx" ON "IndicatorMetadata"("etlStatus");

-- CreateIndex
CREATE INDEX "IndicatorMetadata_importance_idx" ON "IndicatorMetadata"("importance");

-- CreateIndex
CREATE INDEX "IndicatorMetadata_source_idx" ON "IndicatorMetadata"("source");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorTimeSeries_indicatorMetadataId_date_key" ON "IndicatorTimeSeries"("indicatorMetadataId", "date");

-- CreateIndex
CREATE INDEX "IndicatorTimeSeries_indicatorMetadataId_date_idx" ON "IndicatorTimeSeries"("indicatorMetadataId", "date");

-- CreateIndex
CREATE INDEX "IndicatorTimeSeries_date_idx" ON "IndicatorTimeSeries"("date");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorReportDefault_indicatorId_reportTypeId_key" ON "IndicatorReportDefault"("indicatorId", "reportTypeId");

-- CreateIndex
CREATE INDEX "IndicatorReportDefault_reportTypeId_isDefault_idx" ON "IndicatorReportDefault"("reportTypeId", "isDefault");

-- CreateIndex
CREATE INDEX "IndicatorETLLog_indicatorId_idx" ON "IndicatorETLLog"("indicatorId");

-- CreateIndex
CREATE INDEX "IndicatorETLLog_status_idx" ON "IndicatorETLLog"("status");

-- CreateIndex
CREATE INDEX "IndicatorETLLog_createdAt_idx" ON "IndicatorETLLog"("createdAt");

-- CreateIndex
CREATE INDEX "ETLJob_status_idx" ON "ETLJob"("status");

-- CreateIndex
CREATE INDEX "ETLJob_createdAt_idx" ON "ETLJob"("createdAt");

-- AddForeignKey
ALTER TABLE "IndicatorMetadata" ADD CONSTRAINT "IndicatorMetadata_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ChartCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorTimeSeries" ADD CONSTRAINT "IndicatorTimeSeries_indicatorMetadataId_fkey" FOREIGN KEY ("indicatorMetadataId") REFERENCES "IndicatorMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorReportDefault" ADD CONSTRAINT "IndicatorReportDefault_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "IndicatorMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorReportDefault" ADD CONSTRAINT "IndicatorReportDefault_reportTypeId_fkey" FOREIGN KEY ("reportTypeId") REFERENCES "ReportType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorETLLog" ADD CONSTRAINT "IndicatorETLLog_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "IndicatorMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;
