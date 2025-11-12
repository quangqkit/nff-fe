import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JobManagementService } from '../services/job-management.service';
import {
  JobListQueryDto,
  JobDetailResponseDto,
  JobListResponseDto,
} from '../dto/job-management.dto';

@ApiTags('Job Management')
@Controller('jobs')
export class JobManagementController {
  private readonly logger = new Logger(JobManagementController.name);

  constructor(private readonly jobManagementService: JobManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Get all jobs with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Jobs retrieved successfully',
    type: JobListResponseDto,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PROCESSING', 'COMPLETED', 'FAILED'],
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getJobs(@Query() query: JobListQueryDto): Promise<JobListResponseDto> {
    try {
      this.logger.log(`Fetching jobs with filters: ${JSON.stringify(query)}`);
      const result = await this.jobManagementService.getJobs(query);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch jobs: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch jobs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('indicator-logs')
  @ApiOperation({ summary: 'Get all indicator-level job logs' })
  @ApiResponse({ status: 200, description: 'Indicator logs retrieved' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getIndicatorLogs(@Query() query: any) {
    try {
      this.logger.log(
        `Fetching indicator logs with filters: ${JSON.stringify(query)}`,
      );
      const logs = await this.jobManagementService.getIndicatorLogs(query);
      return {
        success: true,
        ...logs,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch indicator logs: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to fetch indicator logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('summary/stats')
  @ApiOperation({ summary: 'Get job statistics summary' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getJobStats() {
    try {
      this.logger.log('Fetching job statistics');
      const stats = await this.jobManagementService.getJobStats();
      return {
        success: true,
        stats,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch job stats: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to fetch statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Get job details by ID' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({
    status: 200,
    description: 'Job details retrieved',
    type: JobDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobById(
    @Param('jobId') jobId: string,
  ): Promise<JobDetailResponseDto> {
    try {
      this.logger.log(`Fetching job details for: ${jobId}`);
      const job = await this.jobManagementService.getJobById(jobId);

      if (!job) {
        throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
      }

      return job;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch job ${jobId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to fetch job: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':jobId/logs')
  @ApiOperation({ summary: 'Get job logs (indicator-level details)' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job logs retrieved' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobLogs(@Param('jobId') jobId: string) {
    try {
      this.logger.log(`Fetching logs for job: ${jobId}`);
      const logs = await this.jobManagementService.getJobLogs(jobId);
      return {
        success: true,
        jobId,
        logs,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch logs for job ${jobId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to fetch job logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('indicator-logs/retry-multiple')
  @ApiOperation({ summary: 'Retry multiple indicator logs' })
  @ApiResponse({
    status: 200,
    description: 'Retry initiated for selected indicators',
  })
  async retryMultipleIndicators(@Body() body: { indicatorIds: number[] }) {
    try {
      this.logger.log(`Retrying indicators: ${body.indicatorIds.join(', ')}`);
      const result = await this.jobManagementService.retryMultipleIndicators(
        body.indicatorIds,
      );
      return {
        success: true,
        message: 'Retry initiated for selected indicators',
        ...result,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retry indicators: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to retry indicators: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':jobId/retry')
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiParam({ name: 'jobId', description: 'Job ID to retry' })
  @ApiResponse({ status: 200, description: 'Job retry initiated' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async retryJob(@Param('jobId') jobId: string) {
    try {
      this.logger.log(`Retrying job: ${jobId}`);
      const result = await this.jobManagementService.retryJob(jobId);
      return {
        success: true,
        message: 'Job retry initiated',
        newJobId: result.newJobId,
        originalJobId: jobId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retry job ${jobId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to retry job: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
