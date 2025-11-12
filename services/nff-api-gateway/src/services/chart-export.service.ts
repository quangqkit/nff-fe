import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  ChartExportData,
  ChartBlockData,
  exportChartIndicator,
  exportAllChartIndicators,
  generateChartFilename,
} from '../utils/chart-export';

@Injectable()
export class ChartExportService {
  constructor(private readonly prisma: PrismaService) {}

  async getChartBlockData(blockId: number): Promise<ChartBlockData | null> {
    const block = await this.prisma.reportBlock.findUnique({
      where: { id: blockId },
      include: {
        section: {
          select: {
            id: true,
            reportId: true,
            report: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!block) {
      return null;
    }

    if (block.type !== 'CHART') {
      throw new NotFoundException(`Block ${blockId} is not a chart block`);
    }

    let content = block.content as any;

    if (!content) {
      throw new NotFoundException(`Block ${blockId} has no content`);
    }

    if (content.selectedIndicators) {
    } else if (content.chartData && content.chartData.selectedIndicators) {
      content = content.chartData;
    } else {
      throw new NotFoundException(
        `Block ${blockId} has invalid chart data structure`,
      );
    }

    return {
      blockId: block.id,
      blockName: block.name || `Chart_${block.id}`,
      chartTitle:
        (block.content as any)?.chartTitle || block.name || `Chart_${block.id}`,
      chartData: {
        categoryId: content.categoryId || 1,
        categoryName: content.categoryName || 'macro',
        selectedIndicators: content.selectedIndicators || [],
      },
    };
  }

  async getAllChartBlocks() {
    return await this.prisma.reportBlock.findMany({
      where: {
        type: 'CHART',
      },
      include: {
        section: {
          select: {
            id: true,
            reportId: true,
            report: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: [{ section: { reportId: 'asc' } }, { orderIndex: 'asc' }],
    });
  }

  async getChartBlocksByReport(reportId: number) {
    return await this.prisma.reportBlock.findMany({
      where: {
        section: {
          reportId: reportId,
        },
        type: 'CHART',
      },
      include: {
        section: {
          select: {
            id: true,
            reportId: true,
            report: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async exportChartIndicator(
    chartBlockData: ChartBlockData,
    indicatorIndex: number = 0,
  ): Promise<ChartExportData | null> {
    return exportChartIndicator(chartBlockData, indicatorIndex, this.prisma);
  }

  async exportAllChartIndicators(
    chartBlockData: ChartBlockData,
  ): Promise<ChartExportData[]> {
    return exportAllChartIndicators(chartBlockData, this.prisma);
  }

  generateChartFilename(chartExportData: ChartExportData): string {
    return generateChartFilename(chartExportData);
  }

  async saveChartExport(
    chartExportData: ChartExportData,
    filename?: string,
  ): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const finalFilename =
      filename || this.generateChartFilename(chartExportData);
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

  async exportChartBlockToFile(
    blockId: number,
    indicatorIndex?: number,
  ): Promise<string> {
    const chartBlockData = await this.getChartBlockData(blockId);

    if (!chartBlockData) {
      throw new NotFoundException(`Chart block with ID ${blockId} not found`);
    }

    const chartExportData = await this.exportChartIndicator(
      chartBlockData,
      indicatorIndex,
    );

    if (!chartExportData) {
      throw new NotFoundException(
        `No valid chart data to export for block ${blockId}`,
      );
    }

    return await this.saveChartExport(chartExportData);
  }

  validateChartBlockData(chartBlockData: ChartBlockData): boolean {
    try {
      if (!chartBlockData.blockId || !chartBlockData.chartData) {
        return false;
      }

      const { chartData } = chartBlockData;

      if (
        !chartData.selectedIndicators ||
        !Array.isArray(chartData.selectedIndicators)
      ) {
        return false;
      }

      for (const indicator of chartData.selectedIndicators) {
        if (!indicator.indicatorId || !indicator.subcategoryData) {
          return false;
        }

        const { subcategoryData } = indicator;
        if (!subcategoryData.id || !subcategoryData.data_points) {
          return false;
        }

        if (!Array.isArray(subcategoryData.data_points)) {
          return false;
        }

        for (const dataPoint of subcategoryData.data_points) {
          if (!dataPoint.date || typeof dataPoint.value !== 'number') {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error validating chart block data:', error);
      return false;
    }
  }

  async getChartBlockSummary(blockId: number) {
    const chartBlockData = await this.getChartBlockData(blockId);

    if (!chartBlockData) {
      throw new NotFoundException(`Chart block with ID ${blockId} not found`);
    }

    const { chartData } = chartBlockData;

    const summary = {
      blockId,
      categoryId: chartData.categoryId,
      categoryName: chartData.categoryName,
      indicatorCount: chartData.selectedIndicators.length,
      indicators: chartData.selectedIndicators.map((indicator) => ({
        id: indicator.indicatorId,
        name:
          indicator.subcategoryData.indicator_name ||
          indicator.subcategoryData.name,
        source: indicator.subcategoryData.source,
        seriesIds: indicator.subcategoryData.series_ids,
        dataPointCount: indicator.subcategoryData.data_points.length,
        chartType: indicator.chartType,
        dateRange: indicator.dateRange,
      })),
    };

    return summary;
  }
}
