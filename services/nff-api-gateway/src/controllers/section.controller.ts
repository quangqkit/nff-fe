import {
  Controller,
  Get,
  Patch,
  Put,
  Param,
  Body,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SectionService } from '../services/section.service';
import { SectionResponseDto } from '../dto/block.dto';

@ApiTags('Sections')
@Controller('sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Patch(':sectionId/toggle')
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
    return this.sectionService.toggleSection(sectionId);
  }

  @Get(':sectionId')
  @ApiOperation({ summary: 'Get section with all blocks' })
  @ApiParam({ name: 'sectionId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Section retrieved successfully',
    type: SectionResponseDto,
  })
  async getSectionWithBlocks(
    @Param('sectionId', ParseIntPipe) sectionId: number,
  ): Promise<SectionResponseDto> {
    return this.sectionService.getSectionWithBlocks(sectionId);
  }

  @Put('bulk-update')
  @ApiOperation({ summary: 'Bulk update sections (enable/disable, reorder)' })
  @ApiResponse({
    status: 200,
    description: 'Sections updated successfully',
    type: [SectionResponseDto],
  })
  @HttpCode(HttpStatus.OK)
  async bulkUpdateSections(
    @Body()
    updateDto: {
      reportId: number;
      updates: Array<{
        sectionId: number;
        isEnabled?: boolean;
        orderIndex?: number;
      }>;
    },
  ): Promise<SectionResponseDto[]> {
    return this.sectionService.bulkUpdateSections(
      updateDto.reportId,
      updateDto.updates,
    );
  }
}
