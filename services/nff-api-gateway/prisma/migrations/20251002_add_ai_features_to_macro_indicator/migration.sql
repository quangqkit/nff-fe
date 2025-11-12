-- AlterTable: Migrate MacroIndicator schema for AI features
-- This migration drops old columns and adds new AI feature columns

-- Step 1: Add new columns with defaults first
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "frequency" VARCHAR(20) DEFAULT 'M';
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "normalized" DECIMAL(8,6);
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "pct_change_1m" DECIMAL(10,4);
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "pct_change_3m" DECIMAL(10,4);
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "pct_change_12m" DECIMAL(10,4);
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "ma_30d" DECIMAL(15,6);
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "ma_90d" DECIMAL(15,6);
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "ma_365d" DECIMAL(15,6);
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "volatility_30d" DECIMAL(15,6);
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "volatility_90d" DECIMAL(15,6);
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "lag_1" DECIMAL(15,6);
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "lag_3" DECIMAL(15,6);
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "lag_6" DECIMAL(15,6);
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "lag_12" DECIMAL(15,6);
ALTER TABLE "MacroIndicator" ADD COLUMN IF NOT EXISTS "trend" VARCHAR(10);

-- Step 2: Rename/migrate existing columns
ALTER TABLE "MacroIndicator" RENAME COLUMN "release_frequency" TO "frequency_old";
ALTER TABLE "MacroIndicator" RENAME COLUMN "trend_direction" TO "trend_old";

-- Step 3: Copy data from old columns to new ones
UPDATE "MacroIndicator" SET "frequency" = COALESCE("frequency_old", 'M');
UPDATE "MacroIndicator" SET "trend" = "trend_old";

-- Step 4: Drop old columns that are no longer needed
DROP INDEX IF EXISTS "idx_macro_indicators_subcategory";
DROP INDEX IF EXISTS "idx_macro_indicators_subcategory_date";
DROP INDEX IF EXISTS "idx_macro_indicators_processing_status";
DROP INDEX IF EXISTS "idx_macro_indicators_quality";
DROP INDEX IF EXISTS "idx_macro_indicators_quality_status";
DROP INDEX IF EXISTS "idx_macro_indicators_units";

ALTER TABLE "MacroIndicator" DROP COLUMN IF EXISTS "frequency_old";
ALTER TABLE "MacroIndicator" DROP COLUMN IF EXISTS "trend_old";
ALTER TABLE "MacroIndicator" DROP COLUMN IF EXISTS "subcategory";
ALTER TABLE "MacroIndicator" DROP COLUMN IF EXISTS "realtime_start";
ALTER TABLE "MacroIndicator" DROP COLUMN IF EXISTS "realtime_end";
ALTER TABLE "MacroIndicator" DROP COLUMN IF EXISTS "data_quality_score";
ALTER TABLE "MacroIndicator" DROP COLUMN IF EXISTS "processing_status";
ALTER TABLE "MacroIndicator" DROP COLUMN IF EXISTS "validation_errors";
ALTER TABLE "MacroIndicator" DROP COLUMN IF EXISTS "normalized_value";
ALTER TABLE "MacroIndicator" DROP COLUMN IF EXISTS "volatility";

-- Step 5: Make frequency non-nullable after data migration
ALTER TABLE "MacroIndicator" ALTER COLUMN "frequency" SET NOT NULL;

-- Step 6: Ensure indexes for AI features
CREATE INDEX IF NOT EXISTS "idx_macro_indicators_trend" ON "MacroIndicator"("trend");

