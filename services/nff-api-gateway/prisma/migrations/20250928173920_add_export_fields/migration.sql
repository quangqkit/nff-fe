-- AlterTable
ALTER TABLE "public"."ReportExport" ADD COLUMN     "downloadUrl" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "metadata" JSONB;

-- CreateIndex
CREATE INDEX "ReportExport_exportType_status_idx" ON "public"."ReportExport"("exportType", "status");

-- CreateIndex
CREATE INDEX "ReportExport_createdAt_idx" ON "public"."ReportExport"("createdAt");

-- CreateIndex
CREATE INDEX "ReportExport_expiresAt_idx" ON "public"."ReportExport"("expiresAt");
