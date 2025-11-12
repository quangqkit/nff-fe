import {
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  ReportTypeDetailResponse,
  ReportTypeResponse,
} from '../types/report-type.types';
import {
  CreateReportTypeDto,
  UpdateReportTypeDto,
} from 'src/dto/report-type.dto';

@Injectable()
export class ReportTypeService {
  private readonly logger = new Logger(ReportTypeService.name);

  constructor(private prisma: PrismaService) {}

  getReportTypes(): Promise<ReportTypeResponse[]> {
    return this.prisma.reportType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        templateConfig: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reports: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }) as Promise<ReportTypeResponse[]>;
  }

  async getReportType(id: number): Promise<ReportTypeDetailResponse> {
    const reportType = await this.prisma.reportType.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        templateConfig: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        reports: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            reports: true,
          },
        },
      },
    });

    if (!reportType) {
      throw new NotFoundException(`Report type with ID ${id} not found`);
    }

    return reportType as ReportTypeDetailResponse;
  }

  async createReportType(
    createReportTypeDto: CreateReportTypeDto,
  ): Promise<ReportTypeResponse> {
    const { name, description } = createReportTypeDto;

    const existingReportType = await this.prisma.reportType.findUnique({
      where: { name },
    });

    if (existingReportType) {
      throw new ConflictException(
        `Report type with name "${name}" already exists`,
      );
    }

    return (await this.prisma.reportType.create({
      data: {
        name,
        description,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        templateConfig: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })) as ReportTypeResponse;
  }

  async updateReportType(
    id: number,
    updateReportTypeDto: UpdateReportTypeDto,
  ): Promise<ReportTypeResponse> {
    const { name, description, isActive } = updateReportTypeDto;

    const existingReportType = await this.prisma.reportType.findUnique({
      where: { id },
    });

    if (!existingReportType) {
      throw new NotFoundException(`Report type with ID ${id} not found`);
    }

    if (name && name !== existingReportType.name) {
      const nameConflict = await this.prisma.reportType.findUnique({
        where: { name },
      });

      if (nameConflict) {
        throw new ConflictException(
          `Report type with name "${name}" already exists`,
        );
      }
    }

    return (await this.prisma.reportType.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        templateConfig: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })) as ReportTypeResponse;
  }

  async deleteReportType(id: number): Promise<{ message: string }> {
    const existingReportType = await this.prisma.reportType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            reports: true,
          },
        },
      },
    });

    if (!existingReportType) {
      throw new NotFoundException(`Report type with ID ${id} not found`);
    }

    if (existingReportType._count.reports > 0) {
      throw new ConflictException(
        `Cannot delete report type "${existingReportType.name}" because it has ${existingReportType._count.reports} report(s) associated with it`,
      );
    }

    await this.prisma.reportType.delete({
      where: { id },
    });

    return {
      message: `Report type "${existingReportType.name}" deleted successfully`,
    };
  }

  async getIndicatorsForReportType(
    reportTypeId: number,
    defaultOnly: boolean = false,
  ): Promise<any> {
    const reportType = await this.prisma.reportType.findUnique({
      where: { id: reportTypeId },
    });

    if (!reportType) {
      throw new NotFoundException(
        `Report type with ID ${reportTypeId} not found`,
      );
    }

    // Get all indicators with their default mappings for this report type
    const indicators = await this.prisma.indicatorMetadata.findMany({
      where: {
        isActive: true,
        ...(defaultOnly && {
          defaultReportMappings: {
            some: {
              reportTypeId: reportTypeId,
              isDefault: true,
            },
          },
        }),
      },
      include: {
        category: true,
        defaultReportMappings: {
          where: {
            reportTypeId: reportTypeId,
          },
        },
      },
      orderBy: [{ importance: 'desc' }, { indicatorEN: 'asc' }],
    });

    return {
      reportType: {
        id: reportType.id,
        name: reportType.name,
        description: reportType.description,
      },
      indicators: indicators.map((indicator) => ({
        id: indicator.id,
        indicatorEN: indicator.indicatorEN,
        indicatorHE: indicator.indicatorHE,
        moduleEN: indicator.moduleEN,
        moduleHE: indicator.moduleHE,
        source: indicator.source,
        seriesIDs: indicator.seriesIDs,
        importance: indicator.importance,
        relevantReports: indicator.relevantReports,
        defaultChartType: indicator.defaultChartType,
        etlStatus: indicator.etlStatus,
        recordsCount: indicator.recordsCount,
        category: indicator.category.name,
        // Add default flag based on mapping
        isDefault:
          indicator.defaultReportMappings.length > 0 &&
          indicator.defaultReportMappings[0].isDefault,
      })),
      total: indicators.length,
    };
  }

  async getIndicatorsForReportTypeName(
    reportTypeName: string,
    defaultOnly: boolean = false,
  ): Promise<any> {
    const reportType = await this.prisma.reportType.findUnique({
      where: { name: reportTypeName },
    });

    if (!reportType) {
      throw new NotFoundException(
        `Report type with name "${reportTypeName}" not found`,
      );
    }

    return this.getIndicatorsForReportType(reportType.id, defaultOnly);
  }

  /**
   * Sync IndicatorReportDefault table based on indicator importance and relevantReports
   * For indicators with importance = 5, if their relevantReports contains a ReportType name,
   * create a default mapping for that indicator-reportType combination.
   * This works per category since each IndicatorMetadata has its own categoryId.
   */
  async syncIndicatorReportDefaults(categoryName?: string): Promise<{
    created: number;
    updated: number;
    deleted: number;
    total: number;
  }> {
    this.logger.log(
      `Starting sync of IndicatorReportDefault${categoryName ? ` for category: ${categoryName}` : ' for all categories'}`,
    );

    let created = 0;
    let updated = 0;
    let deleted = 0;

    // Get all report types
    const reportTypes = await this.prisma.reportType.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const reportTypeMap = new Map(reportTypes.map((rt) => [rt.name, rt.id]));

    // Build where clause for indicators
    const whereClause: any = {
      isActive: true,
    };

    // If category name is specified, filter by category
    if (categoryName) {
      const category = await this.prisma.chartCategory.findFirst({
        where: { name: categoryName },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with name "${categoryName}" not found`,
        );
      }

      whereClause.categoryId = category.id;
    }

    // Get all indicators (with or without category filter)
    const indicators = await this.prisma.indicatorMetadata.findMany({
      where: whereClause,
      include: {
        category: true,
        defaultReportMappings: true,
      },
    });

    this.logger.log(
      `Found ${indicators.length} indicators to process${categoryName ? ` in category ${categoryName}` : ''}`,
    );

    // Process each indicator
    for (const indicator of indicators) {
      const shouldBeDefault = indicator.importance === 5;
      const relevantReportNames = indicator.relevantReports || [];

      this.logger.debug(
        `Processing indicator ${indicator.id} (${indicator.indicatorEN}) - Category: ${indicator.category.name}, Importance: ${indicator.importance}`,
      );

      // For each report type, determine if this indicator should be default
      for (const [reportTypeName, reportTypeId] of reportTypeMap.entries()) {
        const shouldHaveMapping = relevantReportNames.includes(reportTypeName);
        const shouldBeDefaultForThisReport =
          shouldBeDefault && shouldHaveMapping;

        // Find existing mapping
        const existingMapping = indicator.defaultReportMappings.find(
          (m) => m.reportTypeId === reportTypeId,
        );

        if (shouldHaveMapping) {
          // Should have a mapping
          if (existingMapping) {
            // Update if needed
            if (existingMapping.isDefault !== shouldBeDefaultForThisReport) {
              await this.prisma.indicatorReportDefault.update({
                where: { id: existingMapping.id },
                data: { isDefault: shouldBeDefaultForThisReport },
              });
              updated++;
              this.logger.debug(
                `Updated mapping for indicator ${indicator.id} - ${reportTypeName}: isDefault=${shouldBeDefaultForThisReport}`,
              );
            }
          } else {
            // Create new mapping
            await this.prisma.indicatorReportDefault.create({
              data: {
                indicatorId: indicator.id,
                reportTypeId: reportTypeId,
                isDefault: shouldBeDefaultForThisReport,
              },
            });
            created++;
            this.logger.debug(
              `Created mapping for indicator ${indicator.id} (${indicator.indicatorEN}) - ${reportTypeName} (Category: ${indicator.category.name}): isDefault=${shouldBeDefaultForThisReport}`,
            );
          }
        } else {
          // Should NOT have a mapping
          if (existingMapping) {
            // Delete the mapping
            await this.prisma.indicatorReportDefault.delete({
              where: { id: existingMapping.id },
            });
            deleted++;
            this.logger.debug(
              `Deleted mapping for indicator ${indicator.id} - ${reportTypeName}`,
            );
          }
        }
      }
    }

    const total = created + updated + deleted;

    this.logger.log(
      `Sync completed${categoryName ? ` for category ${categoryName}` : ''}: Created=${created}, Updated=${updated}, Deleted=${deleted}, Total=${total}`,
    );

    return { created, updated, deleted, total };
  }

  /**
   * Sync defaults for a specific category only
   */
  async syncDefaultsForCategory(categoryName: string): Promise<{
    created: number;
    updated: number;
    deleted: number;
    total: number;
  }> {
    return this.syncIndicatorReportDefaults(categoryName);
  }

  /**
   * Get a summary of current default mappings grouped by category and report type
   */
  async getDefaultMappingsSummary(): Promise<any> {
    const categories = await this.prisma.chartCategory.findMany({
      where: { isActive: true },
      include: {
        indicators: {
          where: { isActive: true },
          include: {
            defaultReportMappings: {
              where: { isDefault: true },
              include: {
                reportType: true,
              },
            },
          },
        },
      },
    });

    return categories.map((category) => {
      const reportTypeSummary: Record<string, number> = {};

      category.indicators.forEach((indicator) => {
        indicator.defaultReportMappings.forEach((mapping) => {
          const reportTypeName = mapping.reportType.name;
          reportTypeSummary[reportTypeName] =
            (reportTypeSummary[reportTypeName] || 0) + 1;
        });
      });

      return {
        categoryId: category.id,
        categoryName: category.name,
        totalIndicators: category.indicators.length,
        indicatorsWithDefaults: category.indicators.filter(
          (i) => i.defaultReportMappings.length > 0,
        ).length,
        defaultsByReportType: reportTypeSummary,
      };
    });
  }
}
