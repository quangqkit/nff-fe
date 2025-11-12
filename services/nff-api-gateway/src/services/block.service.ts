import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
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
import { BlockType } from '../types/block.types';

@Injectable()
export class BlockService {
  constructor(private prisma: PrismaService) {}

  // Section Management
  async createSection(
    reportId: number,
    createSectionDto: CreateSectionDto,
  ): Promise<SectionResponseDto> {
    const section = await this.prisma.reportSection.create({
      data: {
        reportId,
        title: createSectionDto.title,
        isEnabled: createSectionDto.isEnabled ?? true,
        orderIndex: createSectionDto.orderIndex,
      },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return this.mapSectionToResponse(section);
  }

  async updateSection(
    sectionId: number,
    updateSectionDto: UpdateSectionDto,
  ): Promise<SectionResponseDto> {
    const section = await this.prisma.reportSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    const updatedSection = await this.prisma.reportSection.update({
      where: { id: sectionId },
      data: updateSectionDto,
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return this.mapSectionToResponse(updatedSection);
  }

  async deleteSection(sectionId: number): Promise<{ message: string }> {
    const section = await this.prisma.reportSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    await this.prisma.reportSection.delete({
      where: { id: sectionId },
    });

    return { message: 'Section deleted successfully' };
  }

  async toggleSection(sectionId: number): Promise<SectionResponseDto> {
    const section = await this.prisma.reportSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    const updatedSection = await this.prisma.reportSection.update({
      where: { id: sectionId },
      data: { isEnabled: !section.isEnabled },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return this.mapSectionToResponse(updatedSection);
  }

  // Block Management
  async createBlock(
    sectionId: number,
    createBlockDto: CreateBlockDto,
  ): Promise<BlockResponseDto> {
    try {
      const section = await this.prisma.reportSection.findUnique({
        where: { id: sectionId },
      });

      if (!section) {
        throw new NotFoundException(`Section with ID ${sectionId} not found`);
      }

      const block = await this.prisma.reportBlock.create({
        data: {
          sectionId,
          name: createBlockDto.name,
          type: createBlockDto.type,
          content: createBlockDto.content,
          columns: createBlockDto.columns,
          orderIndex: createBlockDto.orderIndex,
          isEnabled: createBlockDto.isEnabled ?? true,
        },
      });

      return this.mapBlockToResponse(block);
    } catch (error) {
      console.error(`[BlockService] Failed to create block:`, {
        error: error.message,
        stack: error.stack,
        sectionId,
        blockType: createBlockDto.type,
        blockName: createBlockDto.name,
        content: createBlockDto.content,
      });
      throw error;
    }
  }

  async updateBlock(
    blockId: number,
    updateBlockDto: UpdateBlockDto,
  ): Promise<BlockResponseDto> {
    const block = await this.prisma.reportBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException(`Block with ID ${blockId} not found`);
    }

    const updatedBlock = await this.prisma.reportBlock.update({
      where: { id: blockId },
      data: updateBlockDto,
    });

    return this.mapBlockToResponse(updatedBlock);
  }

  async deleteBlock(blockId: number): Promise<{ message: string }> {
    const block = await this.prisma.reportBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException(`Block with ID ${blockId} not found`);
    }

    await this.prisma.reportBlock.delete({
      where: { id: blockId },
    });

    return { message: 'Block deleted successfully' };
  }

  async duplicateBlock(
    blockId: number,
    duplicateBlockDto: DuplicateBlockDto,
  ): Promise<BlockResponseDto> {
    const originalBlock = await this.prisma.reportBlock.findUnique({
      where: { id: blockId },
    });

    if (!originalBlock) {
      throw new NotFoundException(`Block with ID ${blockId} not found`);
    }

    // Get next order index if not provided
    let orderIndex = duplicateBlockDto.orderIndex;
    if (orderIndex === undefined) {
      const maxOrderBlock = await this.prisma.reportBlock.findFirst({
        where: { sectionId: originalBlock.sectionId },
        orderBy: { orderIndex: 'desc' },
      });
      orderIndex = (maxOrderBlock?.orderIndex ?? 0) + 1;
    }

    const duplicatedBlock = await this.prisma.reportBlock.create({
      data: {
        sectionId: originalBlock.sectionId,
        name: duplicateBlockDto.name,
        type: originalBlock.type,
        content: originalBlock.content as any,
        columns: originalBlock.columns,
        orderIndex,
      },
    });

    // Indicator configs are already stored in block content, no need to duplicate separately

    return this.mapBlockToResponse(duplicatedBlock);
  }

  async reorderBlocks(
    sectionId: number,
    reorderDto: ReorderBlocksDto,
  ): Promise<{ message: string }> {
    const section = await this.prisma.reportSection.findUnique({
      where: { id: sectionId },
      include: { blocks: true },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    // Validate that all block IDs belong to this section
    const sectionBlockIds = section.blocks.map((b) => b.id);
    const requestedBlockIds = reorderDto.blocks.map((b) => b.id);

    for (const blockId of requestedBlockIds) {
      if (!sectionBlockIds.includes(blockId)) {
        throw new BadRequestException(
          `Block with ID ${blockId} does not belong to section ${sectionId}`,
        );
      }
    }

    // Update order indexes
    await Promise.all(
      reorderDto.blocks.map((blockUpdate) =>
        this.prisma.reportBlock.update({
          where: { id: blockUpdate.id },
          data: { orderIndex: blockUpdate.orderIndex },
        }),
      ),
    );

    return { message: 'Blocks reordered successfully' };
  }

  async getBlock(blockId: number): Promise<BlockResponseDto> {
    const block = await this.prisma.reportBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException(`Block with ID ${blockId} not found`);
    }

    return this.mapBlockToResponse(block);
  }

  async getSectionBlocks(sectionId: number): Promise<BlockResponseDto[]> {
    const blocks = await this.prisma.reportBlock.findMany({
      where: { sectionId },
      orderBy: { orderIndex: 'asc' },
    });

    return blocks.map((block) => this.mapBlockToResponse(block));
  }

  async getSection(sectionId: number): Promise<SectionResponseDto> {
    const section = await this.prisma.reportSection.findUnique({
      where: { id: sectionId },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    return this.mapSectionToResponse(section);
  }

  async getReportSections(reportId: number): Promise<SectionResponseDto[]> {
    const sections = await this.prisma.reportSection.findMany({
      where: { reportId },
      orderBy: { orderIndex: 'asc' },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return sections.map((section) => this.mapSectionToResponse(section));
  }

  async toggleBlock(blockId: number): Promise<BlockResponseDto> {
    const block = await this.prisma.reportBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException(`Block with ID ${blockId} not found`);
    }

    const updatedBlock = await this.prisma.reportBlock.update({
      where: { id: blockId },
      data: { isEnabled: !block.isEnabled },
    });

    return this.mapBlockToResponse(updatedBlock);
  }

  async exportBlockData(blockId: number): Promise<any> {
    const block = await this.prisma.reportBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException(`Block with ID ${blockId} not found`);
    }

    if (block.type !== BlockType.CHART) {
      throw new BadRequestException(
        'Only chart blocks can be exported for data',
      );
    }

    // Return chart data for export
    return {
      blockId: block.id,
      name: block.name,
      type: block.type,
      chartData: block.content,
      exportedAt: new Date(),
    };
  }

  // Helper methods
  private mapBlockToResponse(block: any): BlockResponseDto {
    return {
      id: block.id,
      sectionId: block.sectionId,
      name: block.name,
      type: block.type as BlockType,
      content: block.content,
      columns: block.columns,
      orderIndex: block.orderIndex,
      isEnabled: block.isEnabled,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    };
  }

  private mapSectionToResponse(section: any): SectionResponseDto {
    return {
      id: section.id,
      reportId: section.reportId,
      title: section.title,
      isEnabled: section.isEnabled,
      orderIndex: section.orderIndex,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
      blocks: section.blocks
        ? section.blocks.map((block) => this.mapBlockToResponse(block))
        : [],
    };
  }
}
