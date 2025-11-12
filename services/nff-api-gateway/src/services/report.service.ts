import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { BlockService } from './block.service';
import {
  ReportResponse,
  SimplifiedReportResponse,
  ReportPreviewResponse,
  ReportValidationResponse,
} from '../types/report-response.types';
import { ReportFiltersDto } from '../dto/report.dto';

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    private blockService: BlockService,
  ) {}

  async getAllReports(): Promise<SimplifiedReportResponse[]> {
    const reports = await this.prisma.report.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reportType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        sections: {
          where: { isEnabled: true },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            isEnabled: true,
            orderIndex: true,
            _count: {
              select: {
                blocks: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return reports.map((report) => ({
      id: report.id,
      title: report.title,
      status: report.status,
      author: report.author,
      reportType: report.reportType,
      summary: report.summary,
      tags: report.tags,
      isArchived: report.isArchived,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      sectionsCount: report.sections.length,
      totalBlocks: report.sections.reduce(
        (sum, section) => sum + section._count.blocks,
        0,
      ),
    }));
  }

  async getAllReportsPaginated(filters: ReportFiltersDto): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      dateFrom,
      dateTo,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;
    const take = limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (category) {
      where.reportType = {
        name: category,
      };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (status) {
      where.status = status;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get total count
    const total = await this.prisma.report.count({ where });

    // Get paginated results
    const reports = await this.prisma.report.findMany({
      where,
      skip,
      take,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reportType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        sections: {
          where: { isEnabled: true },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            isEnabled: true,
            orderIndex: true,
            _count: {
              select: {
                blocks: true,
              },
            },
          },
        },
      },
      orderBy,
    });

    const totalPages = Math.ceil(total / limit);

    // Transform reports to match frontend expectations
    const transformedReports = reports.map((report) => ({
      id: report.id,
      title: report.title,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      publishedAt: report.status === 'published' ? report.updatedAt : null,
      lastUpdated: report.updatedAt,
      reportType: report.reportType,
      author: report.author,
      htmlFileUrl: null, // Add these fields if they exist in your schema
      googleSlidesUrl: null,
      summary: report.summary,
      tags: report.tags,
      exportInfo: {
        hasHtmlExport: false,
        hasPdfExport: false,
        hasSlidesExport: false,
      },
    }));

    // Get available categories for filters
    const categories = await this.prisma.reportType.findMany({
      select: { name: true },
      distinct: ['name'],
    });

    return {
      data: transformedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        applied: {
          search,
          category,
          dateFrom,
          dateTo,
          status,
        },
        available: {
          categories: categories.map((c) => c.name),
          statuses: ['draft', 'published', 'archived'],
        },
      },
    };
  }

  async getReportById(reportId: number): Promise<ReportResponse> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reportType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        sections: {
          orderBy: { orderIndex: 'asc' },
          include: {
            blocks: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    return {
      id: report.id,
      title: report.title,
      status: report.status,
      author: report.author,
      reportType: report.reportType,
      summary: report.summary,
      tags: report.tags,
      isArchived: report.isArchived,
      metadata: report.metadata,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      sections: report.sections.map((section) => ({
        id: section.id,
        title: section.title,
        isEnabled: section.isEnabled,
        orderIndex: section.orderIndex,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
        blocks: section.blocks.map((block) => ({
          id: block.id,
          name: block.name,
          type: block.type,
          content: block.content,
          columns: block.columns,
          orderIndex: block.orderIndex,
          isEnabled: block.isEnabled,
          createdAt: block.createdAt,
          updatedAt: block.updatedAt,
        })),
      })),
    };
  }

  // Create new report
  async createReport(createReportDto: {
    title: string;
    reportTypeId: number;
    authorId: number;
    summary?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<ReportResponse> {
    const report = await this.prisma.report.create({
      data: {
        title: createReportDto.title,
        reportTypeId: createReportDto.reportTypeId,
        authorId: createReportDto.authorId,
        summary: createReportDto.summary,
        tags: createReportDto.tags || [],
        metadata: createReportDto.metadata,
        status: 'draft',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reportType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return {
      id: report.id,
      title: report.title,
      status: report.status,
      author: report.author,
      reportType: report.reportType,
      summary: report.summary,
      tags: report.tags,
      isArchived: report.isArchived,
      metadata: report.metadata,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      sections: [],
    };
  }

  // Update report
  async updateReport(
    reportId: number,
    updateReportDto: {
      title?: string;
      summary?: string;
      tags?: string[];
      metadata?: Record<string, any>;
      status?: string;
    },
  ): Promise<ReportResponse> {
    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: updateReportDto,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reportType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        sections: {
          orderBy: { orderIndex: 'asc' },
          include: {
            blocks: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    return {
      id: report.id,
      title: report.title,
      status: report.status,
      author: report.author,
      reportType: report.reportType,
      summary: report.summary,
      tags: report.tags,
      isArchived: report.isArchived,
      metadata: report.metadata,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      sections: report.sections.map((section) => ({
        id: section.id,
        title: section.title,
        isEnabled: section.isEnabled,
        orderIndex: section.orderIndex,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
        blocks: section.blocks.map((block) => ({
          id: block.id,
          name: block.name,
          type: block.type,
          content: block.content,
          columns: block.columns,
          orderIndex: block.orderIndex,
          isEnabled: block.isEnabled,
          createdAt: block.createdAt,
          updatedAt: block.updatedAt,
        })),
      })),
    };
  }

  // Delete report
  async deleteReport(reportId: number): Promise<void> {
    await this.prisma.report.delete({
      where: { id: reportId },
    });
  }

  // Create report with template sections
  async createReportWithTemplate(
    reportTypeId: number,
    authorId: number,
    title: string,
  ): Promise<ReportResponse> {
    // Create the report
    const report = await this.prisma.report.create({
      data: {
        title,
        reportTypeId,
        authorId,
        status: 'draft',
        summary: `Auto-generated report: ${title}`,
        tags: ['template'],
      },
    });

    // Create default sections
    const defaultSections = [
      { title: 'Executive Summary', orderIndex: 1 },
      { title: 'Market Analysis', orderIndex: 2 },
      { title: 'Key Insights', orderIndex: 3 },
      { title: 'Recommendations', orderIndex: 4 },
    ];

    for (const sectionData of defaultSections) {
      await this.blockService.createSection(report.id, {
        title: sectionData.title,
        orderIndex: sectionData.orderIndex,
      });
    }

    return this.getReportById(report.id);
  }

  // Get report validation status
  async validateReportStructure(
    reportId: number,
  ): Promise<ReportValidationResponse> {
    const report = await this.getReportById(reportId);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if report has at least one enabled section
    const enabledSections = report.sections.filter((s) => s.isEnabled);
    if (enabledSections.length === 0) {
      warnings.push('Report has no enabled sections');
    }

    // Check each section
    for (const section of report.sections) {
      if (section.isEnabled && section.blocks.length === 0) {
        warnings.push(
          `Section "${section.title}" is enabled but has no blocks`,
        );
      }

      // Validate grid layout
      for (const block of section.blocks) {
        if (block.columns < 1 || block.columns > 12) {
          errors.push(
            `Block "${block.name}" has invalid column count: ${block.columns}`,
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Get report with blocks (for block-based architecture)
  async getReportWithBlocks(reportId: number): Promise<ReportResponse> {
    return this.getReportById(reportId);
  }

  // Get report preview data for live preview functionality
  async getReportPreviewData(reportId: number): Promise<ReportPreviewResponse> {
    const report = await this.getReportById(reportId);

    return {
      sections: report.sections
        .filter((section) => section.isEnabled)
        .map((section) => ({
          id: section.id,
          title: section.title,
          isEnabled: section.isEnabled,
          orderIndex: section.orderIndex,
          blocks: section.blocks.map((block) => ({
            id: block.id,
            name: block.name,
            type: block.type,
            columns: block.columns,
            orderIndex: block.orderIndex,
            previewContent: this.generatePreviewContent(block),
          })),
        })),
    };
  }

  private generatePreviewContent(block: any): {
    type: string;
    content?: string;
    hasRichText?: boolean;
    title?: string;
    chartType?: string;
    hasData?: boolean;
    hasImage?: boolean;
    headers?: string[];
    rowCount?: number;
    bulletCount?: number;
    hasNestedBullets?: boolean;
    noteType?: string;
    hasTitle?: boolean;
    noteText?: string;
  } {
    switch (block.type) {
      case 'TEXT':
        return {
          type: 'text',
          content: block.content.plainText || 'Text content...',
          hasRichText: !!block.content.richText,
        };
      case 'CHART':
        return {
          type: 'chart',
          title: block.content.chartTitle || 'Chart',
          chartType: block.content.chartConfig?.type || 'line',
          hasData: !!block.content.chartData,
          hasImage: !!block.content.chartImagePath,
        };
      case 'TABLE':
        return {
          type: 'table',
          headers: block.content.headers || [],
          rowCount: block.content.rows?.length || 0,
          title: block.content.tableTitle,
        };
      case 'BULLETS':
        return {
          type: 'bullets',
          bulletCount: block.content.bullets?.length || 0,
          title: block.content.title,
          hasNestedBullets: block.content.bullets?.some(
            (bullet: any) => bullet.level > 0,
          ),
        };
      case 'NOTES':
        return {
          type: 'notes',
          noteType: block.content.noteType || 'info',
          hasTitle: !!block.content.title,
          noteText: block.content.noteText?.substring(0, 100) + '...',
        };
      default:
        return { type: 'unknown' };
    }
  }

  async generateReport(reportTypeId: number): Promise<ReportResponse> {
    try {
      if (
        !reportTypeId ||
        typeof reportTypeId !== 'number' ||
        reportTypeId <= 0
      ) {
        throw new NotFoundException('Invalid reportTypeId provided');
      }

      const reportType = await this.prisma.reportType.findUnique({
        where: { id: reportTypeId },
      });

      if (!reportType) {
        throw new NotFoundException(
          `Report type with ID ${reportTypeId} not found`,
        );
      }

      let authorId = 1;
      const author = await this.prisma.user.findUnique({
        where: { id: authorId },
      });

      if (!author) {
        try {
          const defaultAuthor = await this.prisma.user.create({
            data: {
              email: 'admin@nff.com',
              password: 'default',
              name: 'System Admin',
            },
          });
          authorId = defaultAuthor.id;
        } catch (error) {
          console.error('Error creating default author:', error);
          throw new Error('Failed to create default author');
        }
      }

      let report;
      try {
        report = await this.prisma.report.create({
          data: {
            title: reportType.name,
            reportTypeId: reportTypeId,
            authorId: authorId,
            status: 'draft',
            summary: reportType.name,
            tags: [reportType.name.toLowerCase()],
            metadata: {
              generatedAt: new Date().toISOString(),
              reportType: reportType.name,
            },
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            reportType: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            sections: {
              orderBy: { orderIndex: 'asc' },
              include: {
                blocks: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        });
      } catch (error) {
        console.error('Error creating report:', error);
        throw new Error('Failed to create report');
      }

      return {
        id: report.id,
        title: report.title,
        status: report.status,
        author: report.author,
        reportType: report.reportType,
        summary: report.summary,
        tags: report.tags,
        isArchived: report.isArchived,
        metadata: report.metadata,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        sections: report.sections.map((section) => ({
          id: section.id,
          title: section.title,
          isEnabled: section.isEnabled,
          orderIndex: section.orderIndex,
          createdAt: section.createdAt,
          updatedAt: section.updatedAt,
          blocks: section.blocks.map((block) => ({
            id: block.id,
            name: block.name,
            type: block.type,
            content: block.content,
            columns: block.columns,
            orderIndex: block.orderIndex,
            isEnabled: block.isEnabled,
            createdAt: block.createdAt,
            updatedAt: block.updatedAt,
          })),
        })),
      };
    } catch (error) {
      console.error('Error in generateReport:', error);
      throw error;
    }
  }

  async getReportSection(reportId: number, sectionId: number): Promise<any> {
    const section = await this.prisma.reportSection.findFirst({
      where: {
        id: sectionId,
        reportId: reportId,
      },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(
        `Section with ID ${sectionId} not found in report ${reportId}`,
      );
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
        type: block.type,
        content: block.content,
        columns: block.columns,
        orderIndex: block.orderIndex,
        isEnabled: block.isEnabled,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
      })),
    };
  }
}
