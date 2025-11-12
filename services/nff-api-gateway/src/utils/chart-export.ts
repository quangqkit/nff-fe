export interface ChartExportData {
  chart_id: string;
  category: string;
  indicator: string;
  preset: string;
  params: Record<string, any>;
  source_meta: {
    provider: string;
    series_ids: string[];
  };
  time: {
    timezone: string;
    generated_at_utc: string;
    last_updated_utc: string;
    range: {
      from_utc: string;
      to_utc: string;
    };
  };
  data: Array<{
    x: string | number;
    y: number;
    extra: Record<string, any>;
  }>;
}

export interface ChartBlockData {
  blockId: number;
  blockName: string;
  chartTitle: string;
  chartData: {
    categoryId: number;
    categoryName: string;
    selectedIndicators: Array<{
      indicatorId: string;
      chartType: string;
      dateRange: {
        preset: string;
        customStart: string;
        customEnd: string;
      };
      subcategoryData: {
        id: number;
        indicator_name?: string;
        name?: string;
        source: string;
        series_ids: string;
        module?: string;
        importance?: number;
        data_points: Array<{
          date: string;
          value: number;
          normalized?: number | null;
          z_score?: number | null;
          originalValue?: number | null;
          hasCalculation?: boolean;
          calculatedValue?: number | null;
        }>;
      };
    }>;
  };
}

const CATEGORY_MAP: Record<number, string> = {
  1: 'Macro',
  2: 'Micro',
  3: 'Options',
  4: 'CTA',
  5: 'Combinations',
  6: 'Exclusive',
};

function generateChartId(
  category: string,
  chartTitle: string,
  preset: string,
  blockId: number,
  seriesIds?: string[],
): string {
  const cleanTitle = chartTitle
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 40);
  const seriesId =
    seriesIds && seriesIds.length > 0
      ? seriesIds[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)
      : blockId.toString();

  return `${cleanTitle}.${seriesId}`;
}

function parseSeriesIds(seriesIds: string): string[] {
  if (!seriesIds) return [];

  return seriesIds
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

function getCurrentUTC(): string {
  return new Date().toISOString();
}

function getDateRange(dataPoints: Array<{ date: string }>): {
  from_utc: string;
  to_utc: string;
} {
  if (!dataPoints || dataPoints.length === 0) {
    const now = getCurrentUTC();
    return { from_utc: now, to_utc: now };
  }

  const dates = dataPoints
    .map((dp) => new Date(dp.date))
    .sort((a, b) => a.getTime() - b.getTime());
  return {
    from_utc: dates[0].toISOString(),
    to_utc: dates[dates.length - 1].toISOString(),
  };
}

function convertDataPoints(
  dataPoints: Array<{
    date: string;
    value: number;
    normalized?: number | null;
    z_score?: number | null;
    originalValue?: number | null;
    hasCalculation?: boolean;
    calculatedValue?: number | null;
  }>,
): Array<{
  x: string | number;
  y: number;
  extra: Record<string, any>;
}> {
  return dataPoints.map((point) => ({
    x: point.date,
    y: point.value,
    extra: {
      ...(point.normalized !== null &&
        point.normalized !== undefined && {
          normalized: point.normalized,
        }),
      ...(point.z_score !== null &&
        point.z_score !== undefined && {
          z_score: point.z_score,
        }),
      ...(point.originalValue !== null &&
        point.originalValue !== undefined && {
          originalValue: point.originalValue,
        }),
      ...(point.hasCalculation !== undefined && {
        hasCalculation: point.hasCalculation,
      }),
      ...(point.calculatedValue !== null &&
        point.calculatedValue !== undefined && {
          calculatedValue: point.calculatedValue,
        }),
    },
  }));
}

export async function exportChartIndicator(
  chartBlockData: ChartBlockData,
  indicatorIndex: number = 0,
  prisma?: any,
): Promise<ChartExportData | null> {
  const { blockId, chartTitle, chartData } = chartBlockData;
  const { selectedIndicators } = chartData;

  if (!selectedIndicators || selectedIndicators.length === 0) {
    return null;
  }

  const indicator = selectedIndicators[indicatorIndex];
  if (!indicator) {
    return null;
  }

  const { subcategoryData } = indicator;

  const category =
    CATEGORY_MAP[chartData.categoryId] || chartData.categoryName || 'Unknown';

  const titleForId =
    chartTitle ||
    subcategoryData.indicator_name ||
    subcategoryData.name ||
    `Indicator_${subcategoryData.id}`;

  const preset = indicator.dateRange.preset || 'CUSTOM';

  let provider = 'Unknown';
  let series_ids: string[] = [];
  let to_utc = new Date().toISOString();

  if (prisma && subcategoryData.id) {
    try {
      const metadata = await prisma.indicatorMetadata.findUnique({
        where: { id: subcategoryData.id },
      });

      if (metadata) {
        provider = metadata.source || 'Unknown';
        series_ids = parseSeriesIds(String(metadata.seriesIDs || ''));

        if (metadata.lastSuccessfulAt) {
          to_utc = metadata.lastSuccessfulAt.toISOString();
        }
      }
    } catch (error) {
      console.error('❌ Error fetching indicator metadata:', error);
    }
  } else {
    series_ids = parseSeriesIds(subcategoryData.series_ids || '');
    provider = subcategoryData.source || 'Unknown';
  }

  const chart_id = generateChartId(
    category,
    titleForId,
    preset,
    blockId,
    series_ids,
  );

  let dataPoints = subcategoryData.data_points || [];
  if (typeof dataPoints === 'string') {
    dataPoints = [];
  }

  const dateRange = getDateRange(dataPoints);
  const data = convertDataPoints(dataPoints);

  const now = getCurrentUTC();

  let finalToUtc = to_utc;
  if (dataPoints && dataPoints.length > 0) {
    const sortedPoints = [...dataPoints].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    finalToUtc = sortedPoints[0].date;
  }

  return {
    chart_id,
    category,
    indicator: chartTitle || titleForId,
    preset,
    params: {
      chartType: indicator.chartType,
      blockId: blockId,
      indicatorId: indicator.indicatorId,
      importance: subcategoryData.importance,
      module: subcategoryData.module,
    },
    source_meta: {
      provider,
      series_ids,
    },
    time: {
      timezone: 'UTC',
      generated_at_utc: now,
      last_updated_utc: now,
      range: {
        from_utc: dateRange.from_utc,
        to_utc: finalToUtc,
      },
    },
    data,
  };
}

export async function exportAllChartIndicators(
  chartBlockData: ChartBlockData,
  prisma?: any,
): Promise<ChartExportData[]> {
  const { selectedIndicators } = chartBlockData.chartData;

  if (!selectedIndicators || selectedIndicators.length === 0) {
    return [];
  }

  const results = await Promise.all(
    selectedIndicators.map((_, index) =>
      exportChartIndicator(chartBlockData, index, prisma),
    ),
  );

  return results.filter((data): data is ChartExportData => data !== null);
}

export function generateChartFilename(
  chartExportData: ChartExportData,
): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');

  const timeStr = now
    .toISOString()
    .split('T')[1]
    .split('.')[0]
    .replace(/:/g, '')
    .substring(0, 4);

  const filenameBase = chartExportData.chart_id;

  const cleanFilename = filenameBase
    .replace(/\./g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .substring(0, 80); // Shorter limit for cleaner filenames

  return `${cleanFilename}_${dateStr}_${timeStr}.json`;
}

export async function saveChartExport(
  chartExportData: ChartExportData,
  filename?: string,
): Promise<string> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const finalFilename = filename || generateChartFilename(chartExportData);
  const exportDir = path.join(process.cwd(), 'exports', 'json');

  try {
    await fs.mkdir(exportDir, { recursive: true });
  } catch (error) {
    console.error('❌ Error creating export directory:', error);
  }

  const filePath = path.join(exportDir, finalFilename);
  const jsonContent = JSON.stringify(chartExportData, null, 2);

  await fs.writeFile(filePath, jsonContent, 'utf8');

  return filePath;
}

export async function exportChartBlockToJSON(
  chartBlockData: ChartBlockData,
  indicatorIndex?: number,
  prisma?: any,
): Promise<string> {
  const chartExportData = await exportChartIndicator(
    chartBlockData,
    indicatorIndex || 0,
    prisma,
  );

  if (!chartExportData) {
    throw new Error('No valid chart data to export');
  }

  return await saveChartExport(chartExportData);
}
