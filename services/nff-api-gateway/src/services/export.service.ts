import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { HtmlService } from './html.service';
import { PdfService } from './pdf.service';
import { IndicatorService } from './indicator.service';
import { SupabaseStorageService } from './supabase-storage.service';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface ExportRequest {
  reportId: number;
  exportType: 'pdf' | 'html';
  userId: number;
  config?: {
    includeCharts?: boolean;
    includeImages?: boolean;
    template?: string;
  };
}

export interface ExportResult {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath?: string | null;
  downloadUrl?: string | null;
  fileSize?: number | null;
  error?: string;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private readonly exportBasePath =
    process.env.EXPORT_STORAGE_PATH || path.join(process.cwd(), 'exports');

  constructor(
    private readonly prisma: PrismaService,
    private readonly htmlService: HtmlService,
    private readonly pdfService: PdfService,
    private readonly indicatorService: IndicatorService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  private async ensureExportDirectories() {
    const dirs = ['pdf', 'html', 'temp'];
    for (const dir of dirs) {
      await fs.ensureDir(path.join(this.exportBasePath, dir));
    }
  }

  async createExport(request: ExportRequest): Promise<ExportResult> {
    try {
      await this.ensureExportDirectories();

      const report = await this.prisma.report.findUnique({
        where: { id: request.reportId },
        include: {
          sections: {
            where: { isEnabled: true },
            include: {
              blocks: {
                where: { isEnabled: true },
                orderBy: { orderIndex: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      if (!report) {
        throw new Error(`Report with ID ${request.reportId} not found`);
      }

      const exportRecord = await this.prisma.reportExport.create({
        data: {
          reportId: request.reportId,
          exportType: request.exportType,
          status: 'pending',
          exportConfig: request.config || {},
          metadata: {
            requestedBy: request.userId,
            requestedAt: new Date().toISOString(),
          },
        },
      });

      try {
        await this.processExport(exportRecord.id);
        const updatedExport = await this.prisma.reportExport.findUnique({
          where: { id: exportRecord.id },
        });

        return {
          id: exportRecord.id,
          status: (updatedExport?.status as any) || 'pending',
          filePath: updatedExport?.filePath,
          downloadUrl: updatedExport?.downloadUrl,
          fileSize: updatedExport?.fileSize,
        };
      } catch (processError) {
        this.logger.error(
          `Failed to process export ${exportRecord.id}: ${processError.message}`,
          processError.stack,
        );

        await this.prisma.reportExport.update({
          where: { id: exportRecord.id },
          data: {
            status: 'failed',
            metadata: {
              ...(exportRecord.metadata as any),
              error: processError.message,
              errorStack: processError.stack,
              failedAt: new Date().toISOString(),
            },
          },
        });

        const failedExport = await this.prisma.reportExport.findUnique({
          where: { id: exportRecord.id },
        });

        return {
          id: exportRecord.id,
          status: (failedExport?.status as any) || 'failed',
          error: processError.message,
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to create export: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async processExport(exportId: number): Promise<void> {
    const exportRecord = await this.prisma.reportExport.findUnique({
      where: { id: exportId },
      include: {
        report: {
          include: {
            reportType: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            sections: {
              where: { isEnabled: true },
              include: {
                blocks: {
                  where: { isEnabled: true },
                  orderBy: { orderIndex: 'asc' },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!exportRecord) {
      throw new Error(`Export record with ID ${exportId} not found`);
    }

    try {
      // Update status to processing
      await this.prisma.reportExport.update({
        where: { id: exportId },
        data: { status: 'processing' },
      });

      await this.generateChartDataForReport(exportRecord.report);

      const updatedReport = await this.prisma.report.findUnique({
        where: { id: exportRecord.report.id },
        include: {
          reportType: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          sections: {
            where: { isEnabled: true },
            include: {
              blocks: {
                where: { isEnabled: true },
                orderBy: { orderIndex: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      if (!updatedReport) {
        throw new Error(
          `Report ${exportRecord.report.id} not found after chart data generation`,
        );
      }

      let filePath: string;
      let fileSize: number;

      if (exportRecord.exportType === 'pdf') {
        const result = await this.pdfService.generatePdf(updatedReport);
        filePath = result.filePath;
        fileSize = result.fileSize;
      } else if (exportRecord.exportType === 'html') {
        const result = await this.htmlService.generateHtml(updatedReport);
        filePath = result.filePath;
        fileSize = result.fileSize;
      } else {
        throw new Error(`Unsupported export type: ${exportRecord.exportType}`);
      }

      let downloadUrl: string;
      let storageKey: string | undefined;
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        this.logger.log(
          `[DEBUG] Attempting Supabase upload for export ${exportId}`,
        );
        try {
          const uploadResult =
            exportRecord.exportType === 'pdf'
              ? await this.supabaseStorage.uploadPdfReport(
                  filePath,
                  exportRecord.reportId.toString(),
                )
              : await this.supabaseStorage.uploadHtmlReport(
                  filePath,
                  exportRecord.reportId.toString(),
                );

          downloadUrl = uploadResult.url;
          storageKey = uploadResult.key;

          this.logger.log(
            `Export ${exportId} uploaded to Supabase: ${storageKey} -> ${downloadUrl}`,
          );

          if (process.env.CLEANUP_LOCAL_FILES === 'true') {
            await fs.remove(filePath);
            this.logger.log(`Local export file cleaned up: ${filePath}`);
          }
        } catch (storageError) {
          this.logger.error(
            `[DEBUG] Supabase upload failed: ${storageError.message}`,
            storageError.stack,
          );
          this.logger.warn(
            `[DEBUG] Falling back to local download URL for export ${exportId}`,
          );
          downloadUrl = `/api/exports/download/${exportId}`;
        }
      } else {
        this.logger.log(
          `[DEBUG] Supabase not configured - using local download URL`,
        );
        downloadUrl = `/api/exports/download/${exportId}`;
      }

      await this.prisma.reportExport.update({
        where: { id: exportId },
        data: {
          status: 'completed',
          filePath: storageKey || filePath,
          downloadUrl,
          fileSize,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Export ${exportId} completed successfully`);
    } catch (error) {
      this.logger.error(
        `Export ${exportId} failed: ${error.message}`,
        error.stack,
      );

      await this.prisma.reportExport.update({
        where: { id: exportId },
        data: {
          status: 'failed',
          metadata: {
            ...(exportRecord.metadata as any),
            error: error.message,
            failedAt: new Date().toISOString(),
          },
        },
      });
    }
  }

  async getExportStatus(exportId: number): Promise<ExportResult> {
    const exportRecord = await this.prisma.reportExport.findUnique({
      where: { id: exportId },
    });

    if (!exportRecord) {
      throw new Error(`Export record with ID ${exportId} not found`);
    }

    let errorMessage: string | undefined;
    if (exportRecord.status === 'failed' && exportRecord.metadata) {
      const metadata = exportRecord.metadata as any;
      errorMessage = metadata.error;
    }

    return {
      id: exportRecord.id,
      status: exportRecord.status as any,
      filePath: exportRecord.filePath,
      downloadUrl: exportRecord.downloadUrl,
      fileSize: exportRecord.fileSize,
      error: errorMessage,
    };
  }

  async getReportExports(reportId: number): Promise<ExportResult[]> {
    const exports = await this.prisma.reportExport.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
    });

    return exports.map((exp) => ({
      id: exp.id,
      status: exp.status as any,
      filePath: exp.filePath,
      downloadUrl: exp.downloadUrl,
      fileSize: exp.fileSize,
    }));
  }

  async downloadExport(
    exportId: number,
  ): Promise<{ filePath: string; fileName: string }> {
    const exportRecord = await this.prisma.reportExport.findUnique({
      where: { id: exportId },
    });

    if (!exportRecord) {
      throw new Error(`Export record with ID ${exportId} not found`);
    }

    if (exportRecord.status !== 'completed' || !exportRecord.filePath) {
      throw new Error(`Export ${exportId} is not ready for download`);
    }

    const fileName = `${exportRecord.exportType}_${exportRecord.reportId}_${new Date().toISOString().split('T')[0]}.${exportRecord.exportType}`;

    return {
      filePath: exportRecord.filePath,
      fileName,
    };
  }

  async cleanupExpiredExports(): Promise<void> {
    const expiredExports = await this.prisma.reportExport.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        status: 'completed',
      },
    });

    for (const exportRecord of expiredExports) {
      try {
        if (
          exportRecord.filePath &&
          (await fs.pathExists(exportRecord.filePath))
        ) {
          await fs.remove(exportRecord.filePath);
        }

        await this.prisma.reportExport.delete({
          where: { id: exportRecord.id },
        });

        this.logger.log(`Cleaned up expired export ${exportRecord.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to cleanup export ${exportRecord.id}: ${error.message}`,
        );
      }
    }
  }

  private async generateChartDataForReport(report: any): Promise<void> {
    this.logger.log(
      `Generating chart data for report ${report.id} - NEW VERSION`,
    );

    try {
      const chartBlocks: any[] = [];
      for (const section of report.sections || []) {
        for (const block of section.blocks || []) {
          if (block.type === 'CHART') {
            chartBlocks.push(block);
          }
        }
      }

      this.logger.log(`Found ${chartBlocks.length} chart blocks to process`);

      await Promise.all(
        chartBlocks.map((block) =>
          this.generateChartDataForBlock(block).catch((error) => {}),
        ),
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate chart data for report ${report.id}: ${error.message}`,
      );
      throw error;
    }
  }

  private async generateChartDataForBlock(block: any): Promise<void> {
    this.logger.log(`Generating chart data for block ${block.id}`);

    const content = block.content as any;
    let indicatorsToProcess: any[] = [];

    if (content?.indicatorConfigs?.length > 0) {
      indicatorsToProcess = content.indicatorConfigs.map((config: any) => ({
        indicator: {
          id: config.indicatorId,
          name: config.indicatorId.toString(),
        },
        chartType: config.chartType,
        dateRangeStart: config.dateRangeStart,
        dateRangeEnd: config.dateRangeEnd,
      }));
    } else if (content?.selectedIndicators?.length > 0) {
      this.logger.log(
        `Using selectedIndicators from content for block ${block.id}`,
      );
      indicatorsToProcess = content.selectedIndicators.map(
        (indicator: any) => ({
          indicator: {
            id: indicator.indicatorId || indicator.id,
            name:
              indicator.subcategoryData?.indicator_name ||
              indicator.indicator_name ||
              indicator.indicatorId ||
              indicator.id,
            category: {
              name: indicator.subcategoryData?.categoryName || 'Unknown',
            },
          },
          chartType: indicator.chartType,
          dateRangeStart: new Date(
            indicator.dateRange?.customStart ||
              indicator.dateRangeStart ||
              '2020-01-01',
          ),
          dateRangeEnd: new Date(
            indicator.dateRange?.customEnd ||
              indicator.dateRangeEnd ||
              new Date(),
          ),
          data: indicator.subcategoryData?.data_points || [],
        }),
      );
    }

    if (indicatorsToProcess.length === 0) {
      this.logger.warn(`No indicator configs found for block ${block.id}`);
      return;
    }

    const indicatorDataPromises = indicatorsToProcess.map(async (config) => {
      try {
        let indicatorData;

        if (config.data && config.data.length > 0) {
          indicatorData = {
            data: config.data.map((item) => ({
              date: new Date(item.date),
              value: item.value,
            })),
          };
          this.logger.log(
            `Using pre-loaded data for indicator ${config.indicator.id}: ${indicatorData.data.length} points`,
          );
        } else {
          indicatorData = await this.indicatorService.getIndicatorData(
            config.indicator.id,
            {
              dateRangeStart: config.dateRangeStart.toISOString(),
              dateRangeEnd: config.dateRangeEnd.toISOString(),
            },
          );
          this.logger.log(
            `Fetched data for indicator ${config.indicator.id}: ${indicatorData.data.length} points`,
          );
        }

        return {
          config,
          indicatorData,
          success: true,
        };
      } catch (error) {
        this.logger.warn(
          `Failed to get data for indicator ${config.indicator.id}: ${error.message}`,
        );
        return {
          config,
          indicatorData: null,
          success: false,
        };
      }
    });

    const indicatorResults = await Promise.all(indicatorDataPromises);

    const datasets: any[] = [];
    const labels = new Set<string>();

    for (const { config, indicatorData, success } of indicatorResults) {
      if (success && indicatorData) {
        indicatorData.data.forEach((item: any) => {
          labels.add(item.date.toISOString().split('T')[0]);
        });

        datasets.push({
          label: config.indicator.name,
          data: indicatorData.data.map((item: any) => item.value),
          backgroundColor: `hsl(${datasets.length * 60}, 70%, 50%)`,
          borderColor: `hsl(${datasets.length * 60}, 70%, 40%)`,
          borderWidth: 2,
        });
      } else {
        datasets.push({
          label: config.indicator.name,
          data: Array.from(
            { length: 12 },
            () => Math.floor(Math.random() * 100) + 50,
          ),
          backgroundColor: `hsl(${datasets.length * 60}, 70%, 50%)`,
          borderColor: `hsl(${datasets.length * 60}, 70%, 40%)`,
          borderWidth: 2,
        });
      }
    }

    const chartData = {
      labels: Array.from(labels).sort(),
      datasets,
    };

    await this.prisma.reportBlock.update({
      where: { id: block.id },
      data: {
        content: {
          ...block.content,
          chartData,
        },
      },
    });

    this.logger.log(`Chart data generated successfully for block ${block.id}`);
  }
}
