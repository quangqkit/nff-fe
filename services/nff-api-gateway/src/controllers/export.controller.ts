import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ExportRequest, ExportService } from '../services/export.service';
import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';

@Controller('exports')
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(private readonly exportService: ExportService) {}

  @Post('reports/:reportId/pdf')
  async exportPdf(
    @Param('reportId') reportId: string,
    @Body() body: { config?: any } = {},
  ) {
    try {
      const exportRequest: ExportRequest = {
        reportId: parseInt(reportId),
        exportType: 'pdf',
        userId: 1,
        config: body?.config || {},
      };

      const result = await this.exportService.createExport(exportRequest);

      const message =
        result.status === 'completed'
          ? 'PDF export completed successfully'
          : result.status === 'failed'
            ? `PDF export failed: ${result.error || 'Unknown error'}`
            : 'PDF export is being processed';

      return {
        success: result.status === 'completed',
        data: result,
        message,
      };
    } catch (error) {
      this.logger.error(`PDF export error: ${error.message}`, error.stack);

      throw new HttpException(
        {
          success: false,
          message: `Failed to export PDF: ${error.message}`,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('reports/:reportId/html')
  async exportHtml(
    @Param('reportId') reportId: string,
    @Body() body: { config?: any } = {},
  ) {
    try {
      const exportRequest: ExportRequest = {
        reportId: parseInt(reportId),
        exportType: 'html',
        userId: 1,
        config: body?.config || {},
      };

      const result = await this.exportService.createExport(exportRequest);

      return {
        success: true,
        data: result,
        message: 'HTML export started. Check status for progress.',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: `Failed to start HTML export: ${error.message}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('status/:exportId')
  async getExportStatus(@Param('exportId') exportId: string) {
    try {
      const result = await this.exportService.getExportStatus(
        parseInt(exportId),
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: `Failed to get export status: ${error.message}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('reports/:reportId')
  async getReportExports(@Param('reportId') reportId: string) {
    try {
      const exports = await this.exportService.getReportExports(
        parseInt(reportId),
      );

      return {
        success: true,
        data: exports,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: `Failed to get report exports: ${error.message}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('download/:exportId')
  async downloadExport(
    @Param('exportId') exportId: string,
    @Res() res: Response,
  ) {
    try {
      const exportRecord = await this.exportService.getExportStatus(
        parseInt(exportId),
      );

      if (exportRecord.status !== 'completed') {
        throw new HttpException(
          {
            success: false,
            message: 'Export is not ready yet',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        exportRecord.downloadUrl &&
        exportRecord.downloadUrl.startsWith('http')
      ) {
        this.logger.log(
          `Proxying download from storage for export ${exportId}: ${exportRecord.downloadUrl}`,
        );

        try {
          const storageResponse = await axios.get(exportRecord.downloadUrl, {
            responseType: 'stream',
          });

          const contentType =
            storageResponse.headers['content-type'] ||
            'application/octet-stream';

          res.setHeader('Content-Type', contentType);
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="export_${exportId}.${contentType.includes('pdf') ? 'pdf' : 'html'}"`,
          );
          res.setHeader('Cache-Control', 'no-cache');

          storageResponse.data.pipe(res);
          return;
        } catch (storageError) {
          this.logger.error(
            `Failed to fetch from storage: ${storageError.message}`,
            storageError.stack,
          );
          throw new HttpException(
            {
              success: false,
              message: 'Failed to fetch export from storage',
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      const { filePath, fileName } = await this.exportService.downloadExport(
        parseInt(exportId),
      );

      if (!(await fs.pathExists(filePath))) {
        throw new HttpException(
          {
            success: false,
            message: 'Export file not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const ext = path.extname(fileName).toLowerCase();
      const contentType = ext === '.pdf' ? 'application/pdf' : 'text/html';

      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.setHeader('Cache-Control', 'no-cache');

      const fileStream = fs.createReadStream(filePath);
      fileStream.on('error', (streamError) => {
        this.logger.error(`File stream error: ${streamError.message}`);
        if (!res.headersSent) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to stream file',
          });
        }
      });

      fileStream.pipe(res);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Download error: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: `Failed to download export: ${error.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('view/:exportId')
  async viewExport(@Param('exportId') exportId: string, @Res() res: Response) {
    try {
      const exportRecord = await this.exportService.getExportStatus(
        parseInt(exportId),
      );

      if (exportRecord.status !== 'completed') {
        throw new HttpException(
          {
            success: false,
            message: 'Export is not ready yet',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        exportRecord.downloadUrl &&
        exportRecord.downloadUrl.startsWith('http')
      ) {
        this.logger.log(
          `Proxying content from storage for export ${exportId}: ${exportRecord.downloadUrl}`,
        );

        try {
          const storageResponse = await axios.get(exportRecord.downloadUrl, {
            responseType: 'stream',
          });

          const contentType =
            storageResponse.headers['content-type'] || 'text/html';

          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader(
            'Content-Disposition',
            `inline; filename="export_${exportId}.${contentType.includes('pdf') ? 'pdf' : 'html'}"`,
          );

          storageResponse.data.pipe(res);
          return;
        } catch (storageError) {
          this.logger.error(
            `Failed to fetch from storage: ${storageError.message}`,
            storageError.stack,
          );
          throw new HttpException(
            {
              success: false,
              message: 'Failed to fetch export from storage',
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      const { filePath, fileName } = await this.exportService.downloadExport(
        parseInt(exportId),
      );

      if (!(await fs.pathExists(filePath))) {
        throw new HttpException(
          {
            success: false,
            message: 'Export file not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const ext = path.extname(fileName).toLowerCase();
      const contentType = ext === '.pdf' ? 'application/pdf' : 'text/html';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: `Failed to view export: ${error.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
