import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdateIndicatorConfigRequest } from '../dto/indicator-config.dto';
import { PrismaService } from './prisma.service';

interface DateRangeOptions {
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

@Injectable()
export class IndicatorService {
  private readonly logger = new Logger(IndicatorService.name);
  private readonly BATCH_SIZE = 5;
  private readonly MAX_DATA_POINTS = 500;

  constructor(private readonly prisma: PrismaService) {}

  async getIndicatorsByCategory(
    categoryId: number,
    dateRangeOptions?: DateRangeOptions,
    reportTypeId?: number,
    limit?: number,
    offset?: number,
  ) {
    const category = await this.prisma.chartCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const totalCount = await this.prisma.indicatorMetadata.count({
      where: {
        categoryId: categoryId,
        isActive: true,
      },
    });

    const indicators = await this.prisma.indicatorMetadata.findMany({
      where: {
        categoryId: categoryId,
        isActive: true,
      },
      include: {
        category: true,
        defaultReportMappings: reportTypeId
          ? {
              where: { reportTypeId: reportTypeId },
            }
          : false,
      },
      orderBy: [
        ...(reportTypeId
          ? [
              {
                defaultReportMappings: {
                  _count: 'desc' as const,
                },
              },
            ]
          : []),
        { importance: 'desc' as const },
        { indicatorEN: 'asc' as const },
      ],
      ...(limit && { take: limit }),
      ...(offset && { skip: offset }),
    });

    const indicatorsWithData = await this.getIndicatorsWithTimeSeriesData(
      indicators,
      dateRangeOptions,
      reportTypeId,
    );

    return {
      data: indicatorsWithData,
      pagination: {
        total: totalCount,
        limit: limit || totalCount,
        offset: offset || 0,
        hasMore:
          offset !== undefined && limit !== undefined
            ? offset + limit < totalCount
            : false,
      },
    };
  }

  private async getIndicatorsWithTimeSeriesData(
    indicators: any[],
    dateRangeOptions?: DateRangeOptions,
    reportTypeId?: number,
  ) {
    const defaultStartDate = new Date('2000-01-01');
    const defaultEndDate = new Date();

    const startDate = dateRangeOptions?.dateRangeStart
      ? new Date(dateRangeOptions.dateRangeStart)
      : defaultStartDate;
    const endDate = dateRangeOptions?.dateRangeEnd
      ? new Date(dateRangeOptions.dateRangeEnd)
      : defaultEndDate;

    this.logger.log(
      `Processing ${indicators.length} indicators in batches of ${this.BATCH_SIZE}`,
    );

    const indicatorsWithData = await this.processBatches(
      indicators,
      async (indicator) => {
        const dataPoints = await this.prisma.indicatorTimeSeries.findMany({
          where: {
            indicatorMetadataId: indicator.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { date: 'desc' },
          take: this.MAX_DATA_POINTS, // Reduced from 1000 to 500
          select: {
            date: true,
            value: true,
            originalValue: true,
            calculatedValue: true,
            hasCalculation: true,
            normalized: true,
            zScore: true,
          },
        });

        const latestPoint = dataPoints[0];

        const isDefault =
          reportTypeId && indicator.defaultReportMappings
            ? indicator.defaultReportMappings.some(
                (mapping: any) =>
                  mapping.reportTypeId === reportTypeId && mapping.isDefault,
              )
            : false;

        // Get indicator config if exists
        const indicatorConfig = await this.getIndicatorConfig(
          indicator.id.toString(),
        );
        return {
          id: indicator.id,
          indicator_id: indicator.id.toString(),
          series_ids: indicator.seriesIDs,
          indicator_name: indicator.indicatorEN,
          indicator_name_he: indicator.indicatorHE,
          module: indicator.moduleEN,
          source: indicator.source,
          defaultChartType: indicatorConfig.chartType, // Use config chartType instead of default
          importance: indicator.importance,
          latest_date: latestPoint?.date || new Date(),
          latest_value: latestPoint?.value || 0,
          recordsCount: indicator.recordsCount,
          ...(reportTypeId !== undefined && { isDefault }),
          data_points: dataPoints.map((dp) => ({
            date: dp.date,
            value:
              typeof dp.value === 'number'
                ? dp.value
                : parseFloat(String(dp.value)) || 0,
            originalValue: dp.originalValue,
            calculatedValue: dp.calculatedValue,
            hasCalculation: dp.hasCalculation,
            normalized: dp.normalized,
            z_score: dp.zScore,
          })),
          subcategoryData: {
            name: indicator.indicatorEN,
            id: indicator.id,
            indicator_name: indicator.indicatorEN,
            categoryName: indicator.category.name,
            indicators: [indicator.indicatorEN],
            values: dataPoints.map((dp) =>
              typeof dp.value === 'number'
                ? dp.value
                : parseFloat(String(dp.value)) || 0,
            ),
            data_points: dataPoints.map((dp) => ({
              date: dp.date,
              value:
                typeof dp.value === 'number'
                  ? dp.value
                  : parseFloat(String(dp.value)) || 0,
            })),
          },
        };
      },
      this.BATCH_SIZE,
    );

    this.logger.log(
      `Successfully processed ${indicatorsWithData.length} indicators`,
    );

    return indicatorsWithData;
  }

  private async processBatches<T, R>(
    items: T[],
    processFunction: (item: T) => Promise<R>,
    batchSize: number,
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map((item) => processFunction(item)),
      );

      results.push(...batchResults);
    }

    return results;
  }

  async getIndicatorConfig(indicatorId: string, blockId?: number) {
    try {
      const indicatorConfig = await this.prisma.indicatorConfig.findFirst({
        where: {
          indicatorId: indicatorId,
          blockId: blockId || null,
        },
      });

      if (indicatorConfig) {
        return {
          indicatorId: indicatorConfig.indicatorId,
          chartType: indicatorConfig.chartType,
          dateRangeStart: indicatorConfig.dateRangeStart,
          dateRangeEnd: indicatorConfig.dateRangeEnd,
          updatedAt: indicatorConfig.updatedAt,
        };
      }

      // Return default config if not found
      return {
        indicatorId: indicatorId,
        chartType: 'line',
        dateRangeStart: new Date('2000-01-01'),
        dateRangeEnd: new Date(),
        updatedAt: null,
      };
    } catch (error) {
      this.logger.error(`Failed to get indicator config: ${error.message}`);
      // Return default config on error
      return {
        indicatorId: indicatorId,
        chartType: 'line',
        dateRangeStart: new Date('2000-01-01'),
        dateRangeEnd: new Date(),
        updatedAt: null,
      };
    }
  }

  async updateIndicatorConfig(
    indicatorId: string,
    config: UpdateIndicatorConfigRequest,
    blockId?: number,
  ) {
    try {
      // Find existing config first
      const existingConfig = await this.prisma.indicatorConfig.findFirst({
        where: {
          indicatorId: indicatorId,
          blockId: blockId || null,
        },
      });

      let indicatorConfig;
      if (existingConfig) {
        // Update existing config
        indicatorConfig = await this.prisma.indicatorConfig.update({
          where: { id: existingConfig.id },
          data: {
            chartType: config.chartType,
            dateRangeStart: new Date(config.dateRangeStart),
            dateRangeEnd: new Date(config.dateRangeEnd),
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new config
        indicatorConfig = await this.prisma.indicatorConfig.create({
          data: {
            indicatorId: indicatorId,
            blockId: blockId || null,
            chartType: config.chartType,
            dateRangeStart: new Date(config.dateRangeStart),
            dateRangeEnd: new Date(config.dateRangeEnd),
          },
        });
      }

      return {
        id: indicatorConfig.id,
        indicatorId: indicatorConfig.indicatorId,
        chartType: indicatorConfig.chartType,
        dateRangeStart: indicatorConfig.dateRangeStart,
        dateRangeEnd: indicatorConfig.dateRangeEnd,
        updatedAt: indicatorConfig.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to update indicator config: ${error.message}`);
      throw error;
    }
  }

  async getIndicatorData(
    indicatorId: number,
    dateRangeOptions?: DateRangeOptions,
  ) {
    const indicator = await this.prisma.indicatorMetadata.findUnique({
      where: { id: indicatorId },
      include: { category: true },
    });

    if (!indicator) {
      throw new NotFoundException(`Indicator with ID ${indicatorId} not found`);
    }

    const defaultStartDate = new Date('2000-01-01');
    const defaultEndDate = new Date();

    const startDate = dateRangeOptions?.dateRangeStart
      ? new Date(dateRangeOptions.dateRangeStart)
      : defaultStartDate;
    const endDate = dateRangeOptions?.dateRangeEnd
      ? new Date(dateRangeOptions.dateRangeEnd)
      : defaultEndDate;

    const indicatorData = await this.prisma.indicatorTimeSeries.findMany({
      where: {
        indicatorMetadataId: indicatorId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return {
      indicatorId: indicatorId,
      indicatorName: indicator.indicatorEN,
      symbol: indicator.seriesIDs || indicatorId.toString(),
      category: indicator.category.name,
      data: indicatorData.map((item) => ({
        date: item.date,
        value: item.value,
        originalValue: item.originalValue,
        calculatedValue: item.calculatedValue,
        hasCalculation: item.hasCalculation,
        normalizedValue: item.normalized,
        zScore: item.zScore,
      })),
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };
  }

  async getIndicatorsForBlock(blockId: number) {
    const block = await this.prisma.reportBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException(`Block with ID ${blockId} not found`);
    }

    if (block.type !== 'CHART') {
      throw new Error('Block is not a chart block');
    }

    const content = block.content as any;
    const indicatorConfigs = content?.indicatorConfigs || [];

    return {
      block,
      indicators: indicatorConfigs.map((config: any) => ({
        id: config.indicatorId,
        chartType: config.chartType,
        dateRangeStart: config.dateRangeStart,
        dateRangeEnd: config.dateRangeEnd,
      })),
    };
  }

  async getAvailableIndicatorsByCategory(
    categoryId: number,
    reportTypeId?: number,
  ) {
    const category = await this.prisma.chartCategory.findUnique({
      where: { id: categoryId },
      include: {
        indicators: {
          where: { isActive: true },
          include: {
            defaultReportMappings: reportTypeId
              ? {
                  where: { reportTypeId: reportTypeId },
                }
              : true,
          },
          orderBy: { indicatorEN: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return {
      category,
      indicators: category.indicators.map((indicator) => {
        const isDefaultForReportType = reportTypeId
          ? indicator.defaultReportMappings.some(
              (mapping) =>
                mapping.reportTypeId === reportTypeId && mapping.isDefault,
            )
          : false;

        return {
          id: indicator.id,
          name: indicator.indicatorEN,
          nameHE: indicator.indicatorHE,
          module: indicator.moduleEN,
          symbol: indicator.seriesIDs || indicator.id.toString(),
          source: indicator.source,
          defaultChartType: indicator.defaultChartType,
          importance: indicator.importance,
          recordsCount: indicator.recordsCount,
          relevantReports: indicator.relevantReports,
          etlStatus: indicator.etlStatus,
          ...(reportTypeId && { isDefault: isDefaultForReportType }),
        };
      }),
    };
  }
}
