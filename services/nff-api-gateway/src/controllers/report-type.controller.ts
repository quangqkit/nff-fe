import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ReportTypeService } from '../services/report-type.service';
import {
  CreateReportTypeDto,
  UpdateReportTypeDto,
} from '../dto/report-type.dto';
import {
  ReportTypeResponse,
  ReportTypeDetailResponse,
} from '../types/report-type.types';

@ApiTags('Report Types')
@Controller('report-types')
export class ReportTypeController {
  constructor(private readonly reportTypeService: ReportTypeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all report types' })
  async getReportTypes(): Promise<ReportTypeResponse[]> {
    return this.reportTypeService.getReportTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report type by ID' })
  @ApiParam({ name: 'id', description: 'Report type ID' })
  async getReportType(
    @Param('id') id: string,
  ): Promise<ReportTypeDetailResponse> {
    return this.reportTypeService.getReportType(parseInt(id));
  }

  @Get(':id/indicators')
  @ApiOperation({ summary: 'Get indicators for a report type' })
  @ApiParam({ name: 'id', description: 'Report type ID' })
  @ApiQuery({
    name: 'defaultOnly',
    required: false,
    description: 'Only return default indicators',
    type: Boolean,
  })
  async getIndicatorsForReportType(
    @Param('id') id: string,
    @Query('defaultOnly') defaultOnly?: string,
  ): Promise<any> {
    return this.reportTypeService.getIndicatorsForReportType(
      parseInt(id),
      defaultOnly === 'true',
    );
  }

  @Get('by-name/:name/indicators')
  @ApiOperation({ summary: 'Get indicators for a report type by name' })
  @ApiParam({ name: 'name', description: 'Report type name' })
  @ApiQuery({
    name: 'defaultOnly',
    required: false,
    description: 'Only return default indicators',
    type: Boolean,
  })
  async getIndicatorsForReportTypeName(
    @Param('name') name: string,
    @Query('defaultOnly') defaultOnly?: string,
  ): Promise<any> {
    return this.reportTypeService.getIndicatorsForReportTypeName(
      name,
      defaultOnly === 'true',
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new report type' })
  async createReportType(
    @Body() createReportTypeDto: CreateReportTypeDto,
  ): Promise<ReportTypeResponse> {
    return this.reportTypeService.createReportType(createReportTypeDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a report type' })
  @ApiParam({ name: 'id', description: 'Report type ID' })
  async updateReportType(
    @Param('id') id: string,
    @Body() updateReportTypeDto: UpdateReportTypeDto,
  ): Promise<ReportTypeResponse> {
    return this.reportTypeService.updateReportType(
      parseInt(id),
      updateReportTypeDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a report type' })
  @ApiParam({ name: 'id', description: 'Report type ID' })
  async deleteReportType(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.reportTypeService.deleteReportType(parseInt(id));
  }

  @Post('sync-defaults')
  @ApiOperation({
    summary: 'Sync indicator-report default mappings for all categories',
    description:
      'Syncs IndicatorReportDefault table based on indicator importance (5) and relevantReports array. Works across all categories.',
  })
  @ApiQuery({
    name: 'categoryName',
    required: false,
    description: 'Optional: sync only for a specific category',
    type: String,
  })
  async syncIndicatorReportDefaults(
    @Query('categoryName') categoryName?: string,
  ): Promise<{
    created: number;
    updated: number;
    deleted: number;
    total: number;
  }> {
    return this.reportTypeService.syncIndicatorReportDefaults(categoryName);
  }

  @Post('sync-defaults/category/:categoryName')
  @ApiOperation({
    summary: 'Sync indicator-report defaults for a specific category',
    description:
      'Syncs IndicatorReportDefault for indicators in the specified category only.',
  })
  @ApiParam({
    name: 'categoryName',
    description: 'Category name (e.g., Macro, Micro, Options)',
  })
  async syncDefaultsForCategory(
    @Param('categoryName') categoryName: string,
  ): Promise<{
    created: number;
    updated: number;
    deleted: number;
    total: number;
  }> {
    return this.reportTypeService.syncDefaultsForCategory(categoryName);
  }

  @Get('defaults/summary')
  @ApiOperation({
    summary: 'Get summary of default indicator mappings by category',
    description:
      'Returns statistics of how many default indicators are mapped to each report type, grouped by category.',
  })
  async getDefaultMappingsSummary(): Promise<any> {
    return this.reportTypeService.getDefaultMappingsSummary();
  }
}
