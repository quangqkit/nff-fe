-- DropForeignKey
ALTER TABLE "ChartIndicatorConfig" DROP CONSTRAINT IF EXISTS "ChartIndicatorConfig_blockId_fkey";
ALTER TABLE "ChartIndicatorConfig" DROP CONSTRAINT IF EXISTS "ChartIndicatorConfig_indicatorId_fkey";
ALTER TABLE "MacroIndicatorConfig" DROP CONSTRAINT IF EXISTS "MacroIndicatorConfig_blockId_fkey";

-- DropTable
DROP TABLE IF EXISTS "ChartIndicatorConfig";
DROP TABLE IF EXISTS "MacroIndicatorConfig";
DROP TABLE IF EXISTS "MacroIndicator";
DROP TABLE IF EXISTS "Indicator";

-- Update ReportBlock to remove old relations (if any)
-- No schema changes needed for ReportBlock as we already removed the relations in schema.prisma

