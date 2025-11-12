/**
 * DTO for Indicator Time Series Response with Dual Value Support
 * Returns both original API values and calculated values for indicators with formulas
 */

export class IndicatorTimeSeriesDataPoint {
  date: Date;

  // Main value (either original or calculated depending on indicator)
  value: number | null;

  // Dual value support
  originalValue?: number | null; // Raw value from API
  calculatedValue?: number | null; // Computed via calculation formula
  hasCalculation: boolean; // Flag indicating if calculation was applied

  // AI Features
  zScore?: number | null;
  normalized?: number | null;
  pctChange1m?: number | null;
  pctChange3m?: number | null;
  pctChange12m?: number | null;
  ma30d?: number | null;
  ma90d?: number | null;
  ma365d?: number | null;
  volatility30d?: number | null;
  volatility90d?: number | null;
  trend?: string | null;
  isOutlier?: boolean | null;
}

export class IndicatorTimeSeriesResponse {
  indicatorId: number;
  indicatorName: string;
  categoryName: string;
  source: string;

  // Calculation info
  hasCalculation: boolean;
  calculation?: string | null; // The formula used

  // Time series data
  data: IndicatorTimeSeriesDataPoint[];

  // Date range
  dateRange: {
    start: Date;
    end: Date;
  };

  // Metadata
  totalRecords: number;
  etlStatus?: string;
  lastSuccessfulAt?: Date | null;
}

export class DualValueChartData {
  /**
   * Chart data that supports both original and calculated values
   * Useful for displaying comparison charts
   */
  labels: string[]; // Date labels

  datasets: Array<{
    label: string;
    type: 'original' | 'calculated';
    data: (number | null | undefined)[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }>;
}
