import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { IndicatorService } from '../services/indicator.service';
import { UpdateIndicatorConfigRequest } from '../dto/indicator-config.dto';

@ApiTags('Indicators')
@Controller('reports')
export class IndicatorController {
  constructor(private readonly indicatorService: IndicatorService) {}

  @Get('categories/:categoryId/indicators')
  @ApiOperation({
    summary:
      'Get indicators by category ID with optional date range filtering and pagination',
  })
  @ApiParam({ name: 'categoryId', type: 'number', description: 'Category ID' })
  @ApiQuery({
    name: 'dateRangeStart',
    required: false,
    description: 'Start date for data filtering (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateRangeEnd',
    required: false,
    description: 'End date for data filtering (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'reportTypeId',
    required: false,
    description: 'Report Type ID to include isDefault flag',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of indicators to return (for lazy loading)',
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of indicators to skip (for pagination)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Indicators retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getIndicatorsByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query('dateRangeStart') dateRangeStart?: string,
    @Query('dateRangeEnd') dateRangeEnd?: string,
    @Query('reportTypeId', new ParseIntPipe({ optional: true }))
    reportTypeId?: number,
    @Query('limit', new ParseIntPipe({ optional: true }))
    limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true }))
    offset?: number,
  ) {
    return this.indicatorService.getIndicatorsByCategory(
      categoryId,
      {
        dateRangeStart,
        dateRangeEnd,
      },
      reportTypeId,
      limit,
      offset,
    );
  }

  @Put('indicators/:indicatorId/config')
  @ApiOperation({
    summary: 'Update indicator configuration (chart type and date range)',
  })
  @ApiParam({
    name: 'indicatorId',
    type: 'string',
    description: 'Indicator ID (can be string for MacroIndicator)',
  })
  @ApiQuery({
    name: 'blockId',
    required: false,
    description: 'Block ID for context-specific configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Indicator configuration updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  async updateIndicatorConfig(
    @Param('indicatorId') indicatorId: string,
    @Body() config: UpdateIndicatorConfigRequest,
    @Query('blockId') blockId?: string,
  ) {
    return this.indicatorService.updateIndicatorConfig(
      indicatorId,
      config,
      blockId ? parseInt(blockId) : undefined,
    );
  }

  @Get('indicators/:indicatorId/config')
  @ApiOperation({ summary: 'Get indicator configuration' })
  @ApiParam({
    name: 'indicatorId',
    type: 'string',
    description: 'Indicator ID (can be string for MacroIndicator)',
  })
  @ApiQuery({
    name: 'blockId',
    required: false,
    description: 'Block ID for context-specific configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Indicator configuration retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  async getIndicatorConfig(
    @Param('indicatorId') indicatorId: string,
    @Query('blockId') blockId?: string,
  ) {
    return this.indicatorService.getIndicatorConfig(
      indicatorId,
      blockId ? parseInt(blockId) : undefined,
    );
  }

  @Get('blocks/:blockId/indicators')
  @ApiOperation({
    summary: 'Get indicators configured for a specific chart block',
  })
  @ApiParam({ name: 'blockId', type: 'number', description: 'Chart block ID' })
  @ApiResponse({
    status: 200,
    description: 'Block indicators retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Block not found' })
  async getIndicatorsForBlock(@Param('blockId', ParseIntPipe) blockId: number) {
    return this.indicatorService.getIndicatorsForBlock(blockId);
  }

  @Get('categories/:categoryId/available-indicators')
  @ApiOperation({
    summary: 'Get available indicators by category for selection',
  })
  @ApiParam({ name: 'categoryId', type: 'number', description: 'Category ID' })
  @ApiQuery({
    name: 'reportTypeId',
    required: false,
    description: 'Report type ID to include default flag',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Available indicators retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getAvailableIndicatorsByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query('reportTypeId') reportTypeId?: string,
  ) {
    const reportTypeIdNum = reportTypeId
      ? parseInt(reportTypeId, 10)
      : undefined;
    return this.indicatorService.getAvailableIndicatorsByCategory(
      categoryId,
      reportTypeIdNum,
    );
  }

  @Get('indicators/:indicatorId/data')
  @ApiOperation({ summary: 'Get indicator data with configurable date range' })
  @ApiParam({
    name: 'indicatorId',
    type: 'number',
    description: 'Indicator ID',
  })
  @ApiQuery({
    name: 'dateRangeStart',
    required: false,
    description: 'Start date for data filtering (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateRangeEnd',
    required: false,
    description: 'End date for data filtering (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Indicator data retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  async getIndicatorData(
    @Param('indicatorId', ParseIntPipe) indicatorId: number,
    @Query('dateRangeStart') dateRangeStart?: string,
    @Query('dateRangeEnd') dateRangeEnd?: string,
  ) {
    return this.indicatorService.getIndicatorData(indicatorId, {
      dateRangeStart,
      dateRangeEnd,
    });
  }
}
