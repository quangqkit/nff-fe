-- CreateEnum
CREATE TYPE "public"."BlockType" AS ENUM ('TEXT', 'CHART', 'TABLE', 'BULLETS', 'NOTES');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChartCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChartCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Indicator" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "dataSource" TEXT NOT NULL,
    "defaultChartType" TEXT NOT NULL DEFAULT 'line',
    "defaultDateRangeStart" TIMESTAMP(3) NOT NULL DEFAULT '2000-01-01'::date,
    "defaultDateRangeEnd" TIMESTAMP(3) NOT NULL DEFAULT '2025-01-01'::date,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Indicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "reportTypeId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "authorId" INTEGER NOT NULL,
    "metadata" JSONB,
    "summary" TEXT,
    "tags" TEXT[],
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportSection" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportBlock" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."BlockType" NOT NULL,
    "content" JSONB NOT NULL,
    "columns" INTEGER NOT NULL DEFAULT 12,
    "orderIndex" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportExport" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "exportType" TEXT NOT NULL,
    "filePath" TEXT,
    "exportConfig" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReportExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportShare" (
    "id" TEXT NOT NULL,
    "reportId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "message" TEXT,
    "shareUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MacroIndicator" (
    "id" SERIAL NOT NULL,
    "indicator_id" VARCHAR(50) NOT NULL,
    "indicator_name" VARCHAR(200) NOT NULL,
    "date" DATE NOT NULL,
    "value" DECIMAL(15,6),
    "normalized_value" DECIMAL(15,6),
    "z_score" DECIMAL(8,4),
    "source" VARCHAR(50) NOT NULL,
    "subcategory" VARCHAR(50) NOT NULL,
    "priority" VARCHAR(20) NOT NULL,
    "release_frequency" VARCHAR(20) NOT NULL,
    "units" VARCHAR(50),
    "realtime_start" TIMESTAMP(6),
    "realtime_end" TIMESTAMP(6),
    "data_quality_score" DECIMAL(3,2),
    "is_outlier" BOOLEAN DEFAULT false,
    "processing_status" VARCHAR(20) DEFAULT 'active',
    "validation_errors" TEXT[],
    "trend_direction" VARCHAR(10),
    "volatility" DECIMAL(8,4),
    "seasonal_adjusted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MacroIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChartIndicatorConfig" (
    "id" SERIAL NOT NULL,
    "blockId" INTEGER,
    "indicatorId" INTEGER NOT NULL,
    "chartType" TEXT NOT NULL DEFAULT 'line',
    "dateRangeStart" TIMESTAMP(3) NOT NULL,
    "dateRangeEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChartIndicatorConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ReportType_name_key" ON "public"."ReportType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ChartCategory_name_key" ON "public"."ChartCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Indicator_symbol_categoryId_key" ON "public"."Indicator"("symbol", "categoryId");

-- CreateIndex
CREATE INDEX "idx_reports_title_search" ON "public"."Report"("title");

-- CreateIndex
CREATE INDEX "idx_reports_status" ON "public"."Report"("status");

-- CreateIndex
CREATE INDEX "idx_reports_created_at" ON "public"."Report"("createdAt");

-- CreateIndex
CREATE INDEX "idx_reports_updated_at" ON "public"."Report"("updatedAt");

-- CreateIndex
CREATE INDEX "idx_reports_archived" ON "public"."Report"("isArchived");

-- CreateIndex
CREATE INDEX "ReportSection_reportId_orderIndex_idx" ON "public"."ReportSection"("reportId", "orderIndex");

-- CreateIndex
CREATE INDEX "ReportBlock_sectionId_orderIndex_idx" ON "public"."ReportBlock"("sectionId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ReportShare_shareUrl_key" ON "public"."ReportShare"("shareUrl");

-- CreateIndex
CREATE INDEX "idx_report_shares_email" ON "public"."ReportShare"("email");

-- CreateIndex
CREATE INDEX "idx_report_shares_url" ON "public"."ReportShare"("shareUrl");

-- CreateIndex
CREATE INDEX "idx_report_shares_expires" ON "public"."ReportShare"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_date" ON "public"."MacroIndicator"("date");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_id_date" ON "public"."MacroIndicator"("indicator_id", "date");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_indicator_id" ON "public"."MacroIndicator"("indicator_id");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_outlier" ON "public"."MacroIndicator"("is_outlier");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_priority" ON "public"."MacroIndicator"("priority");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_priority_date" ON "public"."MacroIndicator"("priority", "date");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_processing_status" ON "public"."MacroIndicator"("processing_status");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_quality" ON "public"."MacroIndicator"("data_quality_score");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_quality_status" ON "public"."MacroIndicator"("data_quality_score", "processing_status");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_source" ON "public"."MacroIndicator"("source");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_subcategory" ON "public"."MacroIndicator"("subcategory");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_subcategory_date" ON "public"."MacroIndicator"("subcategory", "date");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_trend" ON "public"."MacroIndicator"("trend_direction");

-- CreateIndex
CREATE INDEX "idx_macro_indicators_units" ON "public"."MacroIndicator"("units");

-- CreateIndex
CREATE UNIQUE INDEX "MacroIndicator_indicator_id_date_key" ON "public"."MacroIndicator"("indicator_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ChartIndicatorConfig_blockId_indicatorId_key" ON "public"."ChartIndicatorConfig"("blockId", "indicatorId");

-- AddForeignKey
ALTER TABLE "public"."Indicator" ADD CONSTRAINT "Indicator_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ChartCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_reportTypeId_fkey" FOREIGN KEY ("reportTypeId") REFERENCES "public"."ReportType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportSection" ADD CONSTRAINT "ReportSection_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportBlock" ADD CONSTRAINT "ReportBlock_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."ReportSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportExport" ADD CONSTRAINT "ReportExport_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportShare" ADD CONSTRAINT "ReportShare_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChartIndicatorConfig" ADD CONSTRAINT "ChartIndicatorConfig_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "public"."Indicator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChartIndicatorConfig" ADD CONSTRAINT "ChartIndicatorConfig_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "public"."ReportBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
