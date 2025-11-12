import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SectionResponseDto } from '../dto/block.dto';

@Injectable()
export class SectionService {
  constructor(private prisma: PrismaService) {}

  async toggleSection(sectionId: number): Promise<SectionResponseDto> {
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

    const updatedSection = await this.prisma.reportSection.update({
      where: { id: sectionId },
      data: { isEnabled: !section.isEnabled },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return {
      id: updatedSection.id,
      reportId: updatedSection.reportId,
      title: updatedSection.title,
      isEnabled: updatedSection.isEnabled,
      orderIndex: updatedSection.orderIndex,
      createdAt: updatedSection.createdAt,
      updatedAt: updatedSection.updatedAt,
      blocks: updatedSection.blocks.map((block) => ({
        id: block.id,
        sectionId: block.sectionId,
        name: block.name,
        type: block.type as any,
        content: block.content as Record<string, any>,
        columns: block.columns,
        orderIndex: block.orderIndex,
        isEnabled: block.isEnabled,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
      })),
    };
  }

  async bulkUpdateSections(
    reportId: number,
    updates: Array<{
      sectionId: number;
      isEnabled?: boolean;
      orderIndex?: number;
    }>,
  ): Promise<SectionResponseDto[]> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { sections: true },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    const reportSectionIds = report.sections.map((s) => s.id);

    for (const update of updates) {
      if (!reportSectionIds.includes(update.sectionId)) {
        throw new BadRequestException(
          `Section ${update.sectionId} does not belong to report ${reportId}`,
        );
      }
    }

    await Promise.all(
      updates.map((update) =>
        this.prisma.reportSection.update({
          where: { id: update.sectionId },
          data: {
            ...(update.isEnabled !== undefined && {
              isEnabled: update.isEnabled,
            }),
            ...(update.orderIndex !== undefined && {
              orderIndex: update.orderIndex,
            }),
          },
        }),
      ),
    );

    const updatedSections = await this.prisma.reportSection.findMany({
      where: { reportId },
      orderBy: { orderIndex: 'asc' },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return updatedSections.map((section) => ({
      id: section.id,
      reportId: section.reportId,
      title: section.title,
      isEnabled: section.isEnabled,
      orderIndex: section.orderIndex,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
      blocks: section.blocks.map((block) => ({
        id: block.id,
        sectionId: block.sectionId,
        name: block.name,
        type: block.type as any,
        content: block.content as Record<string, any>,
        columns: block.columns,
        orderIndex: block.orderIndex,
        isEnabled: block.isEnabled,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
      })),
    }));
  }

  async getSectionWithBlocks(sectionId: number): Promise<SectionResponseDto> {
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

    return {
      id: section.id,
      reportId: section.reportId,
      title: section.title,
      isEnabled: section.isEnabled,
      orderIndex: section.orderIndex,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
      blocks: section.blocks.map((block) => ({
        id: block.id,
        sectionId: block.sectionId,
        name: block.name,
        type: block.type as any,
        content: block.content as Record<string, any>,
        columns: block.columns,
        orderIndex: block.orderIndex,
        isEnabled: block.isEnabled,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
      })),
    };
  }
}
