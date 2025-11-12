-- Add dual value support for indicators with calculations
-- This allows storing both original API values and calculated values

ALTER TABLE "IndicatorTimeSeries" 
ADD COLUMN "originalValue" DECIMAL(15,6),
ADD COLUMN "calculatedValue" DECIMAL(15,6),
ADD COLUMN "hasCalculation" BOOLEAN NOT NULL DEFAULT false;

-- Create index for querying by calculation status
CREATE INDEX "IndicatorTimeSeries_hasCalculation_idx" ON "IndicatorTimeSeries"("hasCalculation");

-- Add comments for documentation
COMMENT ON COLUMN "IndicatorTimeSeries"."originalValue" IS 'Raw value fetched from API (before calculation)';
COMMENT ON COLUMN "IndicatorTimeSeries"."calculatedValue" IS 'Computed value after applying calculation formula from Excel';
COMMENT ON COLUMN "IndicatorTimeSeries"."hasCalculation" IS 'Flag indicating if this indicator has a calculation formula';
COMMENT ON COLUMN "IndicatorTimeSeries"."value" IS 'Main value - either originalValue or calculatedValue depending on indicator config';
