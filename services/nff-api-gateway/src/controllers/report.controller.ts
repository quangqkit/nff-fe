import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import {
  CreateReportDto,
  UpdateReportDto,
  GenerateReportDto,
  ReportFiltersDto,
} from '../dto/report.dto';
import type {
  ReportResponse,
  ReportPreviewResponse,
  ReportValidationResponse,
  CreateReportWithTemplateRequest,
  DeleteReportResponse,
} from '../types/report-response.types';

@ApiTags('reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all reports',
    description:
      'Retrieves all reports with basic information, supports pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Reports retrieved successfully',
  })
  async getAllReports(
    @Query(ValidationPipe) filters: ReportFiltersDto,
  ): Promise<any> {
    return await this.reportService.getAllReportsPaginated(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportById(@Param('id') id: string): Promise<ReportResponse> {
    return await this.reportService.getReportById(parseInt(id));
  }

  @Get(':id/with-blocks')
  @ApiOperation({ summary: 'Get report with all sections and blocks' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report with blocks retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportWithBlocks(@Param('id') id: string): Promise<ReportResponse> {
    return await this.reportService.getReportWithBlocks(parseInt(id));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({
    status: 201,
    description: 'Report created successfully',
  })
  async createReport(
    @Body(ValidationPipe) createReportDto: CreateReportDto,
  ): Promise<ReportResponse> {
    return await this.reportService.createReport(createReportDto);
  }

  @Post('create-with-template')
  @ApiOperation({ summary: 'Create report with default template and sections' })
  @ApiResponse({
    status: 201,
    description: 'Report created with template successfully',
  })
  async createReportWithTemplate(
    @Body() createTemplateDto: CreateReportWithTemplateRequest,
  ): Promise<ReportResponse> {
    return await this.reportService.createReportWithTemplate(
      createTemplateDto.reportTypeId,
      createTemplateDto.authorId,
      createTemplateDto.title,
    );
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Generate a new report',
    description: 'Generates a new report based on report type',
  })
  @ApiResponse({
    status: 201,
    description: 'Report generated successfully',
  })
  async generateReport(
    @Body() generateReportDto: GenerateReportDto,
  ): Promise<ReportResponse> {
    return await this.reportService.generateReport(
      generateReportDto.reportTypeId,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReport(
    @Param('id') id: string,
    @Body(ValidationPipe) updateReportDto: UpdateReportDto,
  ): Promise<ReportResponse> {
    return await this.reportService.updateReport(parseInt(id), updateReportDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async deleteReport(@Param('id') id: string): Promise<DeleteReportResponse> {
    await this.reportService.deleteReport(parseInt(id));
    return { message: 'Report deleted successfully' };
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate report structure' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report validation completed',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async validateReportStructure(
    @Param('id') id: string,
  ): Promise<ReportValidationResponse> {
    return await this.reportService.validateReportStructure(parseInt(id));
  }

  @Get(':id/preview')
  @ApiOperation({
    summary: 'Get report preview data for live preview functionality',
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report preview data retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportPreviewData(
    @Param('id') id: string,
  ): Promise<ReportPreviewResponse> {
    return await this.reportService.getReportPreviewData(parseInt(id));
  }

  @Get(':reportId/sections/:sectionId')
  @ApiOperation({ summary: 'Get specific section from a report' })
  @ApiParam({ name: 'reportId', description: 'Report ID' })
  @ApiParam({ name: 'sectionId', description: 'Section ID' })
  @ApiResponse({
    status: 200,
    description: 'Section retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async getReportSection(
    @Param('reportId') reportId: string,
    @Param('sectionId') sectionId: string,
  ): Promise<any> {
    return await this.reportService.getReportSection(
      parseInt(reportId),
      parseInt(sectionId),
    );
  }
}
