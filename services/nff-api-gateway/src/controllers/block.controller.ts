import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Logger,
  NotFoundException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BlockService } from '../services/block.service';
import { ChartExportService } from '../services/chart-export.service';
import {
  CreateBlockDto,
  UpdateBlockDto,
  CreateSectionDto,
  UpdateSectionDto,
  ReorderBlocksDto,
  DuplicateBlockDto,
  BlockResponseDto,
  SectionResponseDto,
} from '../dto/block.dto';

@ApiTags('Blocks')
@Controller('blocks')
export class BlockController {
  private readonly logger = new Logger(BlockController.name);

  constructor(
    private readonly blockService: BlockService,
    private readonly chartExportService: ChartExportService,
  ) {}

  @Post('sections/:reportId')
  @ApiOperation({ summary: 'Create a new section in a report' })
  @ApiParam({ name: 'reportId', type: 'number' })
  @ApiResponse({
    status: 201,
    description: 'Section created successfully',
    type: SectionResponseDto,
  })
  async createSection(
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() createSectionDto: CreateSectionDto,
  ): Promise<SectionResponseDto> {
    return this.blockService.createSection(reportId, createSectionDto);
  }

  @Put('sections/:sectionId')
  @ApiOperation({ summary: 'Update a section' })
  @ApiParam({ name: 'sectionId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Section updated successfully',
    type: SectionResponseDto,
  })
  async updateSection(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() updateSectionDto: UpdateSectionDto,
  ): Promise<SectionResponseDto> {
    return this.blockService.updateSection(sectionId, updateSectionDto);
  }

  @Delete('sections/:sectionId')
  @ApiOperation({ summary: 'Delete a section' })
  @ApiParam({ name: 'sectionId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Section deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteSection(
    @Param('sectionId', ParseIntPipe) sectionId: number,
  ): Promise<{ message: string }> {
    return this.blockService.deleteSection(sectionId);
  }

  @Patch('sections/:sectionId/toggle')
  @ApiOperation({ summary: 'Toggle section enabled/disabled state' })
  @ApiParam({ name: 'sectionId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Section toggled successfully',
    type: SectionResponseDto,
  })
  async toggleSection(
    @Param('sectionId', ParseIntPipe) sectionId: number,
  ): Promise<SectionResponseDto> {
    return this.blockService.toggleSection(sectionId);
  }

  @Get('sections/:sectionId')
  @ApiOperation({ summary: 'Get section with all blocks' })
  @ApiParam({ name: 'sectionId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Section retrieved successfully',
    type: SectionResponseDto,
  })
  async getSection(
    @Param('sectionId', ParseIntPipe) sectionId: number,
  ): Promise<SectionResponseDto> {
    return this.blockService.getSection(sectionId);
  }

  @Get('reports/:reportId/sections')
  @ApiOperation({ summary: 'Get all sections for a report' })
  @ApiParam({ name: 'reportId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Sections retrieved successfully',
    type: [SectionResponseDto],
  })
  async getReportSections(
    @Param('reportId', ParseIntPipe) reportId: number,
  ): Promise<SectionResponseDto[]> {
    return this.blockService.getReportSections(reportId);
  }

  // Block endpoints
  @Post('sections/:sectionId/blocks')
  @ApiOperation({ summary: 'Create a new block in a section' })
  @ApiParam({ name: 'sectionId', type: 'number' })
  @ApiResponse({
    status: 201,
    description: 'Block created successfully',
    type: BlockResponseDto,
  })
  async createBlock(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() createBlockDto: CreateBlockDto,
  ): Promise<BlockResponseDto> {
    try {
      this.logger.log(`Creating block in section ${sectionId}:`, {
        type: createBlockDto.type,
        name: createBlockDto.name,
        hasContent: !!createBlockDto.content,
        contentKeys: createBlockDto.content
          ? Object.keys(createBlockDto.content)
          : [],
        indicatorConfigsLength:
          createBlockDto.content?.indicatorConfigs?.length || 0,
        selectedIndicatorsLength:
          createBlockDto.content?.selectedIndicators?.length || 0,
      });

      if (createBlockDto.content?.selectedIndicators) {
        this.logger.log(
          'Selected indicators:',
          createBlockDto.content.selectedIndicators.map((ind) => ({
            id: ind.id,
            chartType: ind.chartType,
            hasDateRange: !!ind.dateRange,
          })),
        );
      }

      const result = await this.blockService.createBlock(
        sectionId,
        createBlockDto,
      );

      this.logger.log(`Block created successfully with ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create block in section ${sectionId}:`, {
        error: error.message,
        stack: error.stack,
        blockType: createBlockDto.type,
        blockName: createBlockDto.name,
        content: createBlockDto.content,
      });
      throw error;
    }
  }

  @Put(':blockId')
  @ApiOperation({ summary: 'Update a block' })
  @ApiParam({ name: 'blockId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Block updated successfully',
    type: BlockResponseDto,
  })
  async updateBlock(
    @Param('blockId', ParseIntPipe) blockId: number,
    @Body() updateBlockDto: UpdateBlockDto,
  ): Promise<BlockResponseDto> {
    return this.blockService.updateBlock(blockId, updateBlockDto);
  }

  @Delete(':blockId')
  @ApiOperation({ summary: 'Delete a block' })
  @ApiParam({ name: 'blockId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Block deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteBlock(
    @Param('blockId', ParseIntPipe) blockId: number,
  ): Promise<{ message: string }> {
    return this.blockService.deleteBlock(blockId);
  }

  @Post(':blockId/duplicate')
  @ApiOperation({ summary: 'Duplicate a block' })
  @ApiParam({ name: 'blockId', type: 'number' })
  @ApiResponse({
    status: 201,
    description: 'Block duplicated successfully',
    type: BlockResponseDto,
  })
  async duplicateBlock(
    @Param('blockId', ParseIntPipe) blockId: number,
    @Body() duplicateBlockDto: DuplicateBlockDto,
  ): Promise<BlockResponseDto> {
    return this.blockService.duplicateBlock(blockId, duplicateBlockDto);
  }

  @Put('sections/:sectionId/blocks/reorder')
  @ApiOperation({ summary: 'Reorder blocks in a section' })
  @ApiParam({ name: 'sectionId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Blocks reordered successfully' })
  @HttpCode(HttpStatus.OK)
  async reorderBlocks(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() reorderDto: ReorderBlocksDto,
  ): Promise<{ message: string }> {
    return this.blockService.reorderBlocks(sectionId, reorderDto);
  }

  @Get(':blockId')
  @ApiOperation({ summary: 'Get a specific block' })
  @ApiParam({ name: 'blockId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Block retrieved successfully',
    type: BlockResponseDto,
  })
  async getBlock(
    @Param('blockId', ParseIntPipe) blockId: number,
  ): Promise<BlockResponseDto> {
    return this.blockService.getBlock(blockId);
  }

  @Get('sections/:sectionId/blocks')
  @ApiOperation({ summary: 'Get all blocks in a section' })
  @ApiParam({ name: 'sectionId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Blocks retrieved successfully',
    type: [BlockResponseDto],
  })
  async getSectionBlocks(
    @Param('sectionId', ParseIntPipe) sectionId: number,
  ): Promise<BlockResponseDto[]> {
    return this.blockService.getSectionBlocks(sectionId);
  }

  @Patch(':blockId/toggle')
  @ApiOperation({ summary: 'Toggle block enabled/disabled state' })
  @ApiParam({ name: 'blockId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Block toggled successfully',
    type: BlockResponseDto,
  })
  async toggleBlock(
    @Param('blockId', ParseIntPipe) blockId: number,
  ): Promise<BlockResponseDto> {
    return this.blockService.toggleBlock(blockId);
  }

  @Get(':blockId/export')
  @ApiOperation({ summary: 'Export block data (for charts)' })
  @ApiParam({ name: 'blockId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Block data exported successfully' })
  async exportBlockData(
    @Param('blockId', ParseIntPipe) blockId: number,
    @Res() res: Response,
  ): Promise<void> {
    const chartBlockData =
      await this.chartExportService.getChartBlockData(blockId);

    if (!chartBlockData) {
      throw new NotFoundException(`Chart block with ID ${blockId} not found`);
    }

    const exportDataList =
      await this.chartExportService.exportAllChartIndicators(chartBlockData);

    if (exportDataList.length === 0) {
      throw new NotFoundException(
        `No indicators found in chart block ${blockId}`,
      );
    }

    const firstExportData = exportDataList[0];
    const filename =
      this.chartExportService.generateChartFilename(firstExportData);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(exportDataList);
  }
}
