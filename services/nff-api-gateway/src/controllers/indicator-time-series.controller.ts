import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { IndicatorTimeSeriesService } from '../services/indicator-time-series.service';

@ApiTags('Indicator Time Series')
@Controller('api/indicator-time-series')
export class IndicatorTimeSeriesController {
  constructor(
    private readonly indicatorTimeSeriesService: IndicatorTimeSeriesService,
  ) {}

  @Get(':indicatorId')
  @ApiOperation({
    summary: 'Get time series data with dual value support',
    description:
      'Returns time series data for an indicator. For indicators with calculations, returns both original API values and calculated values.',
  })
  @ApiParam({
    name: 'indicatorId',
    description: 'Indicator Metadata ID',
    type: Number,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO format)',
    example: '2020-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
    example: '2024-12-31',
  })
  async getIndicatorTimeSeries(
    @Param('indicatorId', ParseIntPipe) indicatorId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.indicatorTimeSeriesService.getIndicatorTimeSeries(
      indicatorId,
      start,
      end,
    );
  }

  @Get(':indicatorId/chart-data')
  @ApiOperation({
    summary: 'Get dual value chart data',
    description:
      'Returns chart-ready data with separate datasets for original and calculated values. Perfect for comparison charts.',
  })
  @ApiParam({
    name: 'indicatorId',
    description: 'Indicator Metadata ID',
    type: Number,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
  })
  async getDualValueChartData(
    @Param('indicatorId', ParseIntPipe) indicatorId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.indicatorTimeSeriesService.getDualValueChartData(
      indicatorId,
      start,
      end,
    );
  }

  @Get('monitoring/etl-status')
  @ApiOperation({
    summary: 'Get ETL status summary for monitoring',
    description:
      'Returns ETL status counts, recent failures, and other monitoring metrics. Useful for tracking data pipeline health.',
  })
  async getETLStatusSummary() {
    return this.indicatorTimeSeriesService.getETLStatusSummary();
  }
}
