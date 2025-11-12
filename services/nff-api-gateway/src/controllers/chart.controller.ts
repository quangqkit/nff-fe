import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ChartService } from '../services/chart.service';

@ApiTags('Charts')
@Controller('charts')
export class ChartController {
  constructor(private readonly chartService: ChartService) {}

  @Post('generate-data')
  @ApiOperation({ summary: 'Generate chart data without creating block' })
  @ApiResponse({
    status: 200,
    description: 'Chart data generated successfully',
  })
  async generateChartData(
    @Body()
    chartData: {
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
    },
  ) {
    return this.chartService.generateChartData(chartData);
  }

  @Post('blocks')
  @ApiOperation({ summary: 'Create a chart block in a section' })
  @ApiResponse({ status: 201, description: 'Chart block created successfully' })
  async createChartBlock(
    @Body()
    chartData: {
      sectionId: number;
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
    return this.chartService.createChartBlock(chartData.sectionId, chartData);
  }

  @Post('blocks/:blockId/generate')
  @ApiOperation({ summary: 'Generate chart data for a chart block' })
  @ApiParam({ name: 'blockId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Chart data generated successfully',
  })
  generateChartDataFromBlock(
    @Param('blockId', ParseIntPipe) blockId: number,
  ): Promise<{
    chartData: any;
    chartImagePath: string | null;
  }> {
    return this.chartService.generateChartDataFromBlock(blockId);
  }

  @Get('blocks/:blockId/export')
  @ApiOperation({ summary: 'Export chart block data' })
  @ApiParam({ name: 'blockId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Chart data exported successfully' })
  async exportChartBlockData(
    @Param('blockId', ParseIntPipe) blockId: number,
  ): Promise<{
    blockId: number;
    name: string;
    chartTitle: string;
    chartData: any;
    indicatorConfigs: any[];
    exportedAt: Date;
    downloadUrl: string;
  }> {
    return this.chartService.exportChartBlockData(blockId);
  }
}
