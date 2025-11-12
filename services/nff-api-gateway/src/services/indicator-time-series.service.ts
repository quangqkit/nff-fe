import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  IndicatorTimeSeriesResponse,
  IndicatorTimeSeriesDataPoint,
  DualValueChartData,
} from '../dto/indicator-time-series-response.dto';

@Injectable()
export class IndicatorTimeSeriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get time series data for an indicator with dual value support
   * Returns both original and calculated values for indicators with formulas
   */
  async getIndicatorTimeSeries(
    indicatorMetadataId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IndicatorTimeSeriesResponse> {
    // Get indicator metadata
    const metadata = await this.prisma.indicatorMetadata.findUnique({
      where: { id: indicatorMetadataId },
      include: {
        category: true,
      },
    });

    if (!metadata) {
      throw new NotFoundException(
        `Indicator with ID ${indicatorMetadataId} not found`,
      );
    }

    // Default date range
    const defaultStartDate = startDate || new Date('2000-01-01');
    const defaultEndDate = endDate || new Date();

    // Query time series data
    const timeSeriesData = await this.prisma.indicatorTimeSeries.findMany({
      where: {
        indicatorMetadataId: indicatorMetadataId,
        date: {
          gte: defaultStartDate,
          lte: defaultEndDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Map to response DTO
    const data: IndicatorTimeSeriesDataPoint[] = timeSeriesData.map((item) => ({
      date: item.date,
      value: item.value ? Number(item.value) : null,
      originalValue: item.originalValue ? Number(item.originalValue) : null,
      calculatedValue: item.calculatedValue
        ? Number(item.calculatedValue)
        : null,
      hasCalculation: item.hasCalculation,
      zScore: item.zScore ? Number(item.zScore) : null,
      normalized: item.normalized ? Number(item.normalized) : null,
      pctChange1m: item.pctChange1m ? Number(item.pctChange1m) : null,
      pctChange3m: item.pctChange3m ? Number(item.pctChange3m) : null,
      pctChange12m: item.pctChange12m ? Number(item.pctChange12m) : null,
      ma30d: item.ma30d ? Number(item.ma30d) : null,
      ma90d: item.ma90d ? Number(item.ma90d) : null,
      ma365d: item.ma365d ? Number(item.ma365d) : null,
      volatility30d: item.volatility30d ? Number(item.volatility30d) : null,
      volatility90d: item.volatility90d ? Number(item.volatility90d) : null,
      trend: item.trend,
      isOutlier: item.isOutlier,
    }));

    return {
      indicatorId: metadata.id,
      indicatorName: metadata.indicatorEN,
      categoryName: metadata.category.name,
      source: metadata.source,
      hasCalculation: !!metadata.calculation,
      calculation: metadata.calculation,
      data,
      dateRange: {
        start: defaultStartDate,
        end: defaultEndDate,
      },
      totalRecords: data.length,
      etlStatus: metadata.etlStatus,
      lastSuccessfulAt: metadata.lastSuccessfulAt,
    };
  }

  /**
   * Get dual value chart data for indicators with calculations
   * Returns separate datasets for original and calculated values
   */
  async getDualValueChartData(
    indicatorMetadataId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<DualValueChartData> {
    const timeSeriesResponse = await this.getIndicatorTimeSeries(
      indicatorMetadataId,
      startDate,
      endDate,
    );

    const labels = timeSeriesResponse.data.map(
      (item) => item.date.toISOString().split('T')[0],
    );

    const datasets: Array<{
      label: string;
      type: 'original' | 'calculated';
      data: (number | null | undefined)[];
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
    }> = [];

    // If indicator has calculation, create two datasets
    if (timeSeriesResponse.hasCalculation) {
      // Original values dataset
      datasets.push({
        label: `${timeSeriesResponse.indicatorName} (Original)`,
        type: 'original' as const,
        data: timeSeriesResponse.data.map((item) => item.originalValue),
        backgroundColor: 'rgba(59, 130, 246, 0.5)', // blue
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      });

      // Calculated values dataset
      datasets.push({
        label: `${timeSeriesResponse.indicatorName} (Calculated)`,
        type: 'calculated' as const,
        data: timeSeriesResponse.data.map((item) => item.calculatedValue),
        backgroundColor: 'rgba(245, 158, 11, 0.5)', // amber
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
      });
    } else {
      // Single dataset for indicators without calculation
      datasets.push({
        label: timeSeriesResponse.indicatorName,
        type: 'original' as const,
        data: timeSeriesResponse.data.map((item) => item.value),
        backgroundColor: 'rgba(34, 197, 94, 0.5)', // green
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
      });
    }

    return {
      labels,
      datasets,
    };
  }

  /**
   * Get ETL status summary for all indicators
   * Useful for monitoring dashboard
   */
  async getETLStatusSummary() {
    const statusCounts = await this.prisma.indicatorMetadata.groupBy({
      by: ['etlStatus'],
      _count: {
        id: true,
      },
    });

    const recentFailures = await this.prisma.indicatorETLLog.findMany({
      where: {
        status: 'ERROR',
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 10,
      include: {
        indicator: {
          select: {
            id: true,
            indicatorEN: true,
            source: true,
          },
        },
      },
    });

    return {
      statusSummary: statusCounts.map((item) => ({
        status: item.etlStatus,
        count: item._count.id,
      })),
      recentFailures: recentFailures.map((log) => ({
        indicatorId: log.indicatorId,
        indicatorName: log.indicator?.indicatorEN,
        source: log.indicator?.source,
        errorCode: log.errorCode,
        errorMessage: log.errorMessage,
        errorCategory: log.errorCategory,
        startedAt: log.startedAt,
      })),
      totalIndicators: await this.prisma.indicatorMetadata.count(),
    };
  }
}
