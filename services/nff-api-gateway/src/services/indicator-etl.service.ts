import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import axios from 'axios';

interface ETLJobResult {
  jobId: string;
  metadata: {
    category: string;
    startDate?: string;
    endDate?: string;
    daysBack?: number;
    totalIndicators?: number;
    importanceMin?: number;
    excelPath?: string;
    sheetName?: string;
  };
}

@Injectable()
export class IndicatorETLService {
  private readonly logger = new Logger(IndicatorETLService.name);
  private readonly dataIngestionServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.dataIngestionServiceUrl =
      this.configService.get<string>('DATA_INGESTION_SERVICE_URL') ||
      this.configService.get<string>('PYTHON_SERVICE_URL') ||
      process.env.PYTHON_SERVICE_URL ||
      'http://localhost:8000';
  }

  async triggerFullHistoricalFetch(
    categoryName: string,
    startDate?: string,
    endDate?: string,
    importanceMin?: number,
  ): Promise<ETLJobResult> {
    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('start_date', startDate);
      } else {
        params.append('start_date', '2000-01-01');
      }
      if (endDate) {
        params.append('end_date', endDate);
      } else {
        params.append('end_date', new Date().toISOString().split('T')[0]);
      }
      if (importanceMin !== undefined) {
        params.append('importance_min', importanceMin.toString());
      }

      this.logger.log(
        `Calling Python ETL service for full fetch: ${categoryName} at ${this.dataIngestionServiceUrl}/api/v1/etl/category/${categoryName}/fetch-all?${params.toString()}`,
      );

      const response = await axios.post(
        `${this.dataIngestionServiceUrl}/api/v1/etl/category/${categoryName}/fetch-all?${params.toString()}`,
        null, // No body, only query params
        {
          timeout: 30000, // 30 seconds timeout
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const finalStartDate = startDate || '2000-01-01';
      const finalEndDate = endDate || new Date().toISOString().split('T')[0];

      return {
        jobId: response.data.job_id,
        metadata: {
          category: categoryName,
          startDate: finalStartDate,
          endDate: finalEndDate,
          importanceMin: importanceMin,
        },
      };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      const errorStatus = error.response?.status || 'N/A';
      const errorUrl = error.config?.url || 'N/A';

      this.logger.error(
        `Failed to trigger full historical fetch for ${categoryName}: ${errorMessage}`,
        {
          status: errorStatus,
          url: errorUrl,
          pythonServiceUrl: this.dataIngestionServiceUrl,
          stack: error.stack,
        },
      );
      throw new Error(`Full historical fetch failed: ${errorMessage}`);
    }
  }

  async importIndicatorsFromExcel(
    excelPath: string,
    sheetName: string,
    categoryName: string,
  ): Promise<ETLJobResult> {
    try {
      const payload = {
        excelPath: excelPath,
        sheetName: sheetName,
        categoryName: categoryName,
      };

      this.logger.log(
        `Calling Python ETL service for Excel import: ${sheetName} -> ${categoryName}`,
      );

      const response = await axios.post(
        `${this.dataIngestionServiceUrl}/api/v1/indicators/import`,
        payload,
        {
          timeout: 2000000,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        jobId: response.data.job_id,
        metadata: {
          category: categoryName,
          excelPath: excelPath,
          sheetName: sheetName,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to import from Excel: ${error.message}`,
        error.stack,
      );
      throw new Error(`Excel import failed: ${error.message}`);
    }
  }

  async getIndicatorsByCategory(
    categoryName: string,
    importanceMin?: number,
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (importanceMin) {
        params.append('importance_min', importanceMin.toString());
      }

      const response = await axios.get(
        `${this.dataIngestionServiceUrl}/api/v1/indicators?category_name=${categoryName}&${params.toString()}`,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get indicators: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to get indicators: ${error.message}`);
    }
  }

  async cleanETLTables(): Promise<{
    etlLogs: number;
    timeSeries: number;
    reportDefaults: number;
    indicators: number;
    etlJobs: number;
  }> {
    try {
      this.logger.log('Starting ETL tables cleanup...');

      const deletedETLLogs = await this.prisma.indicatorETLLog.deleteMany({});
      const deletedTimeSeries =
        await this.prisma.indicatorTimeSeries.deleteMany({});
      const deletedReportDefaults =
        await this.prisma.indicatorReportDefault.deleteMany({});
      const deletedIndicators = await this.prisma.indicatorMetadata.deleteMany(
        {},
      );
      const deletedETLJobs = await this.prisma.eTLJob.deleteMany({});

      const result = {
        etlLogs: deletedETLLogs.count,
        timeSeries: deletedTimeSeries.count,
        reportDefaults: deletedReportDefaults.count,
        indicators: deletedIndicators.count,
        etlJobs: deletedETLJobs.count,
      };

      this.logger.log(`Cleanup completed: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to clean ETL tables: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
