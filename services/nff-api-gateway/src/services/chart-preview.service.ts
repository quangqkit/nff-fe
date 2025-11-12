import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ChartPreviewService {
  constructor(private prisma: PrismaService) {}

  async getIndicatorsWithValues(categoryName: string) {
    try {
      // First, get the category
      const category = await this.prisma.chartCategory.findFirst({
        where: { name: categoryName },
      });

      if (!category) {
        return {
          categoryName,
          indicators: [],
          totalIndicators: 0,
          totalDataPoints: 0,
          error: 'Category not found',
        };
      }

      // Get all indicators in this category with their time series data
      const indicators = await this.prisma.indicatorMetadata.findMany({
        where: {
          categoryId: category.id,
          isActive: true,
        },
        include: {
          timeSeries: {
            orderBy: { date: 'asc' },
            take: 1000, // Limit for performance
          },
        },
        orderBy: { indicatorEN: 'asc' },
      });

      const result = indicators.map((indicator) => ({
        indicator_id: indicator.seriesIDs || indicator.id.toString(),
        indicator_name: indicator.indicatorEN,
        source: indicator.source,
        importance: indicator.importance,
        defaultChartType: indicator.defaultChartType,
        recordsCount: indicator.recordsCount,
        values: indicator.timeSeries.map((ts) => ({
          date: ts.date,
          value: ts.value,
          originalValue: ts.originalValue,
          calculatedValue: ts.calculatedValue,
          hasCalculation: ts.hasCalculation,
        })),
      }));

      const totalDataPoints = indicators.reduce(
        (sum, ind) => sum + ind.timeSeries.length,
        0,
      );

      return {
        categoryName,
        indicators: result,
        totalIndicators: result.length,
        totalDataPoints: totalDataPoints,
      };
    } catch (error) {
      console.error('Error fetching indicators with values:', error);
      return {
        categoryName,
        indicators: [],
        totalIndicators: 0,
        totalDataPoints: 0,
        error: 'Failed to fetch indicators',
      };
    }
  }
}
