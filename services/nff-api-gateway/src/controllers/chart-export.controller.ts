import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ChartExportService } from '../services/chart-export.service';

export interface ExportChartRequest {
  blockId: number;
  indicatorIndex?: number;
}

export interface ExportAllChartsRequest {
  reportId?: number;
  blockIds?: number[];
}

@Controller('charts/export')
export class ChartExportController {
  constructor(private readonly chartExportService: ChartExportService) {}

  @Post('single')
  async exportSingleChart(
    @Body() request: ExportChartRequest,
    @Res() res: Response,
  ) {
    try {
      const { blockId, indicatorIndex = 0 } = request;

      const chartBlockData =
        await this.chartExportService.getChartBlockData(blockId);

      if (!chartBlockData) {
        throw new HttpException(
          `Chart block with ID ${blockId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      const exportData = await this.chartExportService.exportChartIndicator(
        chartBlockData,
        indicatorIndex,
      );

      if (!exportData) {
        throw new HttpException(
          `No valid chart data found for block ${blockId}, indicator ${indicatorIndex}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const filename =
        this.chartExportService.generateChartFilename(exportData);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      res.json(exportData);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to export chart: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('block/:blockId')
  async exportChartBlock(
    @Param('blockId') blockId: number,
    @Res() res: Response,
  ) {
    try {
      const chartBlockData =
        await this.chartExportService.getChartBlockData(blockId);

      if (!chartBlockData) {
        throw new HttpException(
          `Chart block with ID ${blockId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      const exportDataList =
        await this.chartExportService.exportAllChartIndicators(chartBlockData);

      if (exportDataList.length === 0) {
        throw new HttpException(
          `No indicators found in chart block ${blockId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const filename = this.chartExportService.generateChartFilename(
        exportDataList[0],
      );

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      res.json(exportDataList);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to export chart block: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('report/:reportId')
  async exportReportCharts(
    @Param('reportId') reportId: number,
    @Res() res: Response,
  ) {
    try {
      const chartBlocks =
        await this.chartExportService.getChartBlocksByReport(reportId);

      if (chartBlocks.length === 0) {
        throw new HttpException(
          `No chart blocks found in report ${reportId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const allExportData: any[] = [];
      for (const block of chartBlocks) {
        const blockData = await this.chartExportService.getChartBlockData(
          block.id,
        );
        if (blockData) {
          const exportData =
            await this.chartExportService.exportAllChartIndicators(blockData);
          allExportData.push(...exportData);
        }
      }

      if (allExportData.length === 0) {
        throw new HttpException(
          `No valid chart data found in report ${reportId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, '')
        .replace('T', '_');
      const filename = `report_${reportId}_charts_${timestamp}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      res.json(allExportData);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to export report charts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('preview/:blockId')
  async getExportPreview(
    @Param('blockId') blockId: number,
    @Query('indicatorIndex') indicatorIndex?: number,
  ) {
    try {
      const index = indicatorIndex
        ? parseInt(indicatorIndex.toString(), 10)
        : 0;

      const chartBlockData =
        await this.chartExportService.getChartBlockData(blockId);

      if (!chartBlockData) {
        throw new HttpException(
          `Chart block with ID ${blockId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      const exportData = await this.chartExportService.exportChartIndicator(
        chartBlockData,
        index,
      );

      if (!exportData) {
        throw new HttpException(
          `No valid chart data found for block ${blockId}, indicator ${index}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: exportData,
        filename: this.chartExportService.generateChartFilename(exportData),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to preview export: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('blocks')
  async getAvailableBlocks(@Query('reportId') reportId?: number) {
    try {
      let blocks;

      if (reportId) {
        blocks = await this.chartExportService.getChartBlocksByReport(reportId);
      } else {
        blocks = await this.chartExportService.getAllChartBlocks();
      }

      return {
        success: true,
        data: blocks.map((block) => ({
          id: block.id,
          name: block.name,
          type: block.type,
          reportId: block.reportId,
          order: block.order,
          content: block.content,
        })),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get chart blocks: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
