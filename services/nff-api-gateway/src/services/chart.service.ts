import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { BlockService } from './block.service';
import { BlockType } from '../types/block.types';

@Injectable()
export class ChartService {
  constructor(
    private prisma: PrismaService,
    private blockService: BlockService,
  ) {}

  async createChartBlock(
    sectionId: number,
    chartData: {
      name: string;
      chartTitle: string;
      categoryId: number;
      selectedIndicators: Array<{
        id: number;
        chartType: string;
        dateRange: {
          preset: string;
          customStart?: string;
          customEnd?: string;
        };
      }>;
      chartConfig: {
        position: string;
        config: string;
      };
      columns?: number;
      orderIndex: number;
    },
  ): Promise<any> {
    // Get category info
    const category = await this.prisma.chartCategory.findUnique({
      where: { id: chartData.categoryId },
      select: { id: true, name: true },
    });

    if (!category) {
      throw new NotFoundException('Chart category not found');
    }

    // Create chart block
    const block = await this.blockService.createBlock(sectionId, {
      name: chartData.name,
      type: BlockType.CHART,
      content: {
        chartTitle: chartData.chartTitle,
        chartConfig: {
          type: 'line',
          position: chartData.chartConfig.position,
          title: chartData.chartTitle,
          ...JSON.parse(chartData.chartConfig.config || '{}'),
        },
        chartData: {
          labels: [],
          datasets: [],
        },
        chartImagePath: null,
        indicatorConfigs: chartData.selectedIndicators.map((indicator) => ({
          indicatorId: parseInt(indicator.id.toString()),
          chartType: indicator.chartType,
          dateRangeStart: indicator.dateRange.customStart
            ? new Date(indicator.dateRange.customStart)
            : new Date('2020-01-01'),
          dateRangeEnd: indicator.dateRange.customEnd
            ? new Date(indicator.dateRange.customEnd)
            : new Date(),
        })),
      },
      columns: chartData.columns || 6,
      orderIndex: chartData.orderIndex,
    });

    // Indicator configs are already stored in block content
    // No need to create separate ChartIndicatorConfig entries

    return {
      ...block,
      categoryName: category.name,
      indicatorConfigs: chartData.selectedIndicators,
    };
  }

  async generateChartDataFromBlock(blockId: number): Promise<{
    chartData: any;
    chartImagePath: string | null;
  }> {
    return this.generateChartDataFromBlockId(blockId);
  }

  async generateChartData(chartData: {
    categoryId: number;
    title: string;
    selectedIndicators: Array<{
      id: number;
      chartType: string;
      dateRange: {
        preset: string;
        customStart?: string;
        customEnd?: string;
      };
    }>;
    chartConfig: {
      position: string;
      config: string;
    };
  }): Promise<{
    chartData: any;
    chartImagePath: string | null;
  }> {
    // Generate mock chart data based on selected indicators
    const chartDataResult = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: chartData.selectedIndicators.map((indicator, index) => ({
        label: `Indicator ${indicator.id}`,
        data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 100)),
        backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
        borderColor: `hsl(${index * 60}, 70%, 40%)`,
        borderWidth: 2,
      })),
    };

    const chartImagePath = `/charts/generated-${Date.now()}.png`;

    return {
      chartData: chartDataResult,
      chartImagePath,
    };
  }

  async generateChartDataFromBlockId(blockId: number): Promise<{
    chartData: any;
    chartImagePath: string | null;
  }> {
    const block = await this.blockService.getBlock(blockId);

    if (block.type !== BlockType.CHART) {
      throw new Error('Block is not a chart block');
    }

    // Get indicator configs from block content
    const content = block.content as any;
    const indicatorConfigs = content?.indicatorConfigs || [];

    if (indicatorConfigs.length === 0) {
      throw new Error('No indicators configured for this chart block');
    }

    // Generate chart data based on indicators
    const chartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: indicatorConfigs.map((config: any, index: number) => ({
        label: `Indicator ${config.indicatorId}`,
        data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 100)),
        backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
        borderColor: `hsl(${index * 60}, 70%, 40%)`,
        borderWidth: 2,
      })),
    };

    // Generate chart image path
    const chartImagePath = `/charts/block-${blockId}-${Date.now()}.png`;

    // Update block with generated data
    await this.blockService.updateBlock(blockId, {
      content: {
        ...block.content,
        chartData,
        chartImagePath,
      },
    });

    return {
      chartData,
      chartImagePath,
    };
  }

  async exportChartBlockData(blockId: number): Promise<{
    blockId: number;
    name: string;
    chartTitle: string;
    chartData: any;
    indicatorConfigs: any[];
    exportedAt: Date;
    downloadUrl: string;
  }> {
    const block = await this.blockService.getBlock(blockId);

    if (block.type !== BlockType.CHART) {
      throw new Error('Block is not a chart block');
    }

    // Get indicator configs from block content
    const content = block.content as any;
    const indicatorConfigs = content?.indicatorConfigs || [];

    const exportData = {
      blockId: block.id,
      name: block.name,
      chartTitle: content?.chartTitle || 'Untitled Chart',
      chartData: content?.chartData || block.content,
      indicatorConfigs: indicatorConfigs.map((config: any) => ({
        indicatorId: config.indicatorId,
        chartType: config.chartType,
        dateRange: {
          start: config.dateRangeStart,
          end: config.dateRangeEnd,
        },
      })),
      blockContent: block.content,
      exportedAt: new Date(),
      downloadUrl: `/api/exports/chart-block-${blockId}-${Date.now()}.json`,
    };

    return exportData;
  }
}
