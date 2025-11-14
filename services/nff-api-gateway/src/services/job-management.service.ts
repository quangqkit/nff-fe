import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import axios from 'axios';
import {
  JobListQueryDto,
  JobDetailResponseDto,
  JobListResponseDto,
} from '../dto/job-management.dto';

@Injectable()
export class JobManagementService {
  private readonly logger = new Logger(JobManagementService.name);
  private readonly dataIngestionServiceUrl: string;

  constructor(private readonly prisma: PrismaService) {
    this.dataIngestionServiceUrl =
      process.env.DATA_INGESTION_SERVICE_URL ||
      process.env.PYTHON_SERVICE_URL ||
      'http://localhost:8000';
  }

  async getJobs(query: JobListQueryDto): Promise<JobListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Fetch jobs with pagination
    const [jobs, total] = await Promise.all([
      this.prisma.eTLJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.eTLJob.count({ where }),
    ]);

    // Get summary stats
    const summary = await this.getJobStats();

    // Calculate duration for completed jobs
    const jobsWithDetails: JobDetailResponseDto[] = jobs.map((job) => {
      let durationSeconds: number | undefined;
      if (job.completedAt && job.startedAt) {
        durationSeconds =
          (job.completedAt.getTime() - job.startedAt.getTime()) / 1000;
      }

      return {
        jobId: job.jobId,
        status: job.status as any,
        totalIndicators: job.totalIndicators,
        successful: job.successful,
        failed: job.failed,
        blocked: job.blocked,
        startedAt: job.startedAt.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        durationSeconds,
        metadata: job.metadata as any,
        createdAt: job.createdAt.toISOString(),
      };
    });

    return {
      jobs: jobsWithDetails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
    };
  }

  async getJobById(jobId: string): Promise<JobDetailResponseDto | null> {
    const job = await this.prisma.eTLJob.findUnique({
      where: { jobId },
    });

    if (!job) {
      return null;
    }

    let durationSeconds: number | undefined;
    if (job.completedAt && job.startedAt) {
      durationSeconds =
        (job.completedAt.getTime() - job.startedAt.getTime()) / 1000;
    }

    return {
      jobId: job.jobId,
      status: job.status as any,
      totalIndicators: job.totalIndicators,
      successful: job.successful,
      failed: job.failed,
      blocked: job.blocked,
      startedAt: job.startedAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      durationSeconds,
      metadata: job.metadata as any,
      createdAt: job.createdAt.toISOString(),
    };
  }

  async getIndicatorLogs(query: any) {
    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      const searchNum = parseInt(query.search);
      const orConditions: any[] = [];

      orConditions.push({
        indicator: {
          indicatorEN: { contains: query.search, mode: 'insensitive' },
        },
      });

      if (!isNaN(searchNum)) {
        orConditions.push({
          indicatorId: searchNum,
        });
      }

      where.OR = orConditions;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const endDateTime = new Date(query.endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    // Log the where clause for debugging
    this.logger.log(
      `[DEBUG] IndicatorETLLog query where clause: ${JSON.stringify(where, null, 2)}`,
    );

    const [logs, total] = await Promise.all([
      this.prisma.indicatorETLLog.findMany({
        where,
        include: {
          indicator: {
            select: {
              id: true,
              indicatorEN: true,
              indicatorHE: true,
              categoryId: true,
              seriesIDs: true,
              apiExample: true,
              source: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [{ id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.indicatorETLLog.count({ where }),
    ]);

    this.logger.log(
      `[DEBUG] IndicatorETLLog query result: Found ${logs.length} logs, Total=${total}`,
    );

    const validLogs = logs.filter((log) => log.indicator !== null);

    if (validLogs.length !== logs.length) {
      this.logger.warn(
        `[DEBUG] Found ${logs.length - validLogs.length} orphaned IndicatorETLLog records (indicator relation is null)`,
      );
    }

    const mappedLogs = validLogs.map((log) => ({
      id: log.id,
      indicatorId: log.indicatorId,
      indicatorName: log.indicator?.indicatorEN || 'Unknown',
      categoryName: log.indicator?.category?.name || 'Unknown',
      jobId: log.jobId,
      status: log.status,
      errorCode: log.errorCode,
      errorMessage: log.errorMessage,
      errorCategory: log.errorCategory,
      recordsProcessed: log.recordsProcessed,
      recordsInserted: log.recordsInserted,
      recordsUpdated: log.recordsUpdated,
      startedAt: log.startedAt?.toISOString(),
      completedAt: log.completedAt?.toISOString(),
      createdAt: log.createdAt.toISOString(),
      metadata: log.metadata,
      apiSource: log.indicator?.source || null,
      seriesId: log.indicator?.seriesIDs || null,
      apiExample: log.indicator?.apiExample || null,
    }));

    return {
      logs: mappedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getJobLogs(jobId: string) {
    const logs = await this.prisma.indicatorETLLog.findMany({
      where: {
        jobId: {
          contains: jobId.split('_')[1],
        },
      },
      include: {
        indicator: {
          select: {
            id: true,
            indicatorEN: true,
            indicatorHE: true,
            categoryId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return logs.map((log) => ({
      id: log.id,
      indicatorId: log.indicatorId,
      indicatorName: log.indicator.indicatorEN,
      status: log.status,
      errorCode: log.errorCode,
      errorMessage: log.errorMessage,
      errorCategory: log.errorCategory,
      recordsProcessed: log.recordsProcessed,
      recordsInserted: log.recordsInserted,
      recordsUpdated: log.recordsUpdated,
      startedAt: log.startedAt?.toISOString(),
      completedAt: log.completedAt?.toISOString(),
      createdAt: log.createdAt.toISOString(),
      metadata: log.metadata,
    }));
  }

  async retryMultipleIndicators(indicatorIds: number[]) {
    try {
      const response = await axios.post(
        `${this.dataIngestionServiceUrl}/api/v1/etl/jobs`,
        {
          indicator_ids: indicatorIds,
          force_refresh: true,
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        jobId: response.data.job_id || response.data.jobId,
        indicatorCount: indicatorIds.length,
      };
    } catch (error) {
      this.logger.error(`Failed to retry indicators via API: ${error.message}`);
      throw new Error(`Failed to retry indicators: ${error.message}`);
    }
  }

  async getJobStats() {
    const [total, processing, completed, failed] = await Promise.all([
      this.prisma.eTLJob.count(),
      this.prisma.eTLJob.count({ where: { status: 'PROCESSING' } }),
      this.prisma.eTLJob.count({ where: { status: 'COMPLETED' } }),
      this.prisma.eTLJob.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      total,
      processing,
      completed,
      failed,
    };
  }

  async retryJob(jobId: string) {
    const originalJob = await this.prisma.eTLJob.findUnique({
      where: { jobId },
    });

    if (!originalJob) {
      throw new Error('Job not found');
    }

    const metadata = originalJob.metadata as any;

    try {
      let response;

      if (metadata?.type === 'category_full') {
        // Category job
        response = await axios.post(
          `${this.dataIngestionServiceUrl}/api/v1/etl/category/${metadata.category}/fetch-all`,
          null,
          {
            params: {
              start_date: metadata.start_date,
              end_date: metadata.end_date,
              importance_min: metadata.importance_min,
            },
            timeout: 10000,
          },
        );
      } else if (metadata?.type === 'incremental') {
        response = await axios.post(
          `${this.dataIngestionServiceUrl}/api/v1/etl/incremental/${metadata.category}`,
          null,
          {
            params: {
              days_back: metadata.days_back,
            },
            timeout: 10000,
          },
        );
      } else {
        response = await axios.post(
          `${this.dataIngestionServiceUrl}/api/v1/etl/jobs`,
          {
            indicator_ids: metadata?.indicator_ids,
            category: metadata?.category,
            source: metadata?.source,
            force_refresh: metadata?.force_refresh || false,
          },
          {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      }

      return {
        newJobId: response.data.job_id || response.data.jobId,
        originalJobId: jobId,
      };
    } catch (error) {
      this.logger.error(`Failed to retry job via API: ${error.message}`);
      throw new Error(`Failed to retry job: ${error.message}`);
    }
  }
}
