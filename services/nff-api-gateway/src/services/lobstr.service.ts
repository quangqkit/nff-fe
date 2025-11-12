import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';
import {
  LobstrSquidsListResponse,
  LobstrSquidDetailsResponse,
  LobstrSchedule,
  LobstrSquid,
  LobstrRunResponse,
  LobstrRunsListResponse,
  LobstrRunDetailResponse,
  LobstrDownloadResponse,
  LobstrAddTasksRequest,
  LobstrAddTasksResponse,
  LobstrGetTasksResponse,
  LobstrTask,
} from '../types/lobstr.interface';
import { TriggerRunDto } from '../dto/trigger-run.dto';
import { LobstrRetryContext } from '../types/lobstr.interface';
import { LobstrErrorClassifier } from '../utils/lobstr-error-classifier';
import { LobstrRetryHelper } from '../utils/lobstr-retry-helper';

@Injectable()
export class LobstrService {
  private readonly logger = new Logger(LobstrService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly retryHelper: LobstrRetryHelper;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey = this.configService.get<string>('LOBSTR_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('LOBSTR_BASE_URL') || '';
    this.retryHelper = new LobstrRetryHelper();
  }

  async getSquidsList(): Promise<LobstrSquidsListResponse> {
    const baseUrl = this.baseUrl.endsWith('/v1')
      ? this.baseUrl
      : `${this.baseUrl}/v1`;
    const fullUrl = `${baseUrl}/squids`;
    const headers = {
      Authorization: `Token ${this.apiKey}`,
    };
    const response = await firstValueFrom(
      this.httpService.get<LobstrSquidsListResponse>(fullUrl, {
        headers,
      }),
    );

    return {
      data: response.data.data.slice(0, 4),
      total_results: response.data.total_results,
      limit: response.data.limit,
      page: response.data.page,
      total_pages: response.data.total_pages,
      result_from: response.data.result_from,
      result_to: response.data.result_to,
    };
  }

  async getSquidDetails(squidId: string): Promise<LobstrSquidDetailsResponse> {
    const baseUrl = this.baseUrl.endsWith('/v1')
      ? this.baseUrl
      : `${this.baseUrl}/v1`;
    const fullUrl = `${baseUrl}/squids/${squidId}`;
    const headers = {
      Authorization: `Token ${this.apiKey}`,
    };
    const response = await firstValueFrom(
      this.httpService.get<LobstrSquidDetailsResponse>(fullUrl, {
        headers,
      }),
    );

    return response.data;
  }

  async syncSquidsToDatabase(): Promise<{ totalFetched: number }> {
    await this.prisma.lobstrSchedule.deleteMany({});
    const allSquids = await this.fetchAllSquids();
    await this.prisma.lobstrSchedule.createMany({
      data: allSquids.map((squid) => this.convertSquidToSchedule(squid)),
    });

    return {
      totalFetched: allSquids.length,
    };
  }

  private async fetchAllSquids(): Promise<LobstrSquid[]> {
    try {
      const response = await this.getSquidsList();
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch squids: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private convertSquidToSchedule(squid: LobstrSquid): any {
    return {
      scheduleId: squid.id,
      name: squid.name,
      description: null,
      isActive: squid.is_active,
      cronExpression: squid.cron_expression,
      timezone: squid.timezone,
      lookbackHours: squid.params.hours_back,
      keywords: [],
      accounts: squid.accounts.map((acc) => acc.id),
    };
  }

  async getSchedules(): Promise<LobstrSchedule[]> {
    const schedules = await this.prisma.lobstrSchedule.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return schedules;
  }

  async triggerRun(triggerRunDto: TriggerRunDto): Promise<LobstrRunResponse> {
    try {
      const baseUrl = this.baseUrl.endsWith('/v1')
        ? this.baseUrl
        : `${this.baseUrl}/v1`;
      const fullUrl = `${baseUrl}/runs`;

      const headers = {
        Authorization: `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      const requestBody: any = {
        squid: triggerRunDto.squidId,
      };

      if (triggerRunDto.startDate || triggerRunDto.endDate) {
        const startDateObj = triggerRunDto.startDate
          ? new Date(triggerRunDto.startDate)
          : undefined;
        const endDateObj = triggerRunDto.endDate
          ? new Date(triggerRunDto.endDate)
          : undefined;
        const { startDate, endDate } = this.calculateDateRange(
          startDateObj,
          endDateObj,
        );

        if (startDate) {
          requestBody.start_date = startDate.toISOString();
        }
        if (endDate) {
          requestBody.end_date = endDate.toISOString();
        }

        this.logger.log(
          `Triggering run with date range: ${startDate?.toISOString()} to ${endDate?.toISOString()}`,
        );
      } else {
        this.logger.log(
          `Triggering run without date range (using schedule default)`,
        );
      }

      if (triggerRunDto.metadata) {
        requestBody.metadata = triggerRunDto.metadata;
      }

      this.logger.log(
        `[TRIGGER] Triggering run for Squid ID: ${triggerRunDto.squidId}`,
      );

      const response = await firstValueFrom(
        this.httpService.post<LobstrRunResponse>(fullUrl, requestBody, {
          headers,
        }),
      );

      this.logger.log(
        `[TRIGGER] Run triggered successfully - Squid ID: ${triggerRunDto.squidId}, Run ID: ${response.data.id}`,
      );
      this.logger.log(
        `[TEST INFO] For Swagger testing - Squid ID: ${triggerRunDto.squidId}, Run ID: ${response.data.id}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to trigger run: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to trigger run: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private calculateDateRange(
    startDate?: Date,
    endDate?: Date,
  ): { startDate: Date; endDate: Date } {
    const now = new Date();

    const calculatedEndDate = endDate || now;

    let calculatedStartDate: Date;
    if (startDate) {
      calculatedStartDate = startDate;
    } else {
      calculatedStartDate = new Date(
        calculatedEndDate.getTime() - 24 * 60 * 60 * 1000,
      );
    }

    return {
      startDate: calculatedStartDate,
      endDate: calculatedEndDate,
    };
  }

  async getRunsList(squidId: string): Promise<LobstrRunsListResponse> {
    const retryContext: LobstrRetryContext = {
      attempt: 0,
      consecutive_same_errors: 0,
    };

    return this.getRunsListWithRetry(squidId, retryContext);
  }

  private async getRunsListWithRetry(
    squidId: string,
    context: LobstrRetryContext,
  ): Promise<LobstrRunsListResponse> {
    context.attempt++;

    try {
      const baseUrl = this.baseUrl.endsWith('/v1')
        ? this.baseUrl
        : `${this.baseUrl}/v1`;
      const fullUrl = `${baseUrl}/runs?squid=${squidId}`;

      const headers = {
        Authorization: `Token ${this.apiKey}`,
      };

      this.logger.log(
        `[Attempt ${context.attempt}] Fetching runs for squid: ${squidId}`,
      );

      const response = await firstValueFrom(
        this.httpService.get<LobstrRunsListResponse>(fullUrl, {
          headers,
          timeout: 30000,
        }),
      );

      if (response.data.data && response.data.data.length > 0) {
        response.data.data.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      }

      this.logger.log(
        `Successfully fetched ${response.data.data?.length || 0} runs for squid: ${squidId}`,
      );
      return response.data;
    } catch (error) {
      const errorCode = LobstrErrorClassifier.classifyError(error);
      const errorDetails = LobstrErrorClassifier.extractErrorDetails(error);

      // Update retry context
      context.last_error_code = errorCode;
      if (context.last_error_code === errorCode) {
        context.consecutive_same_errors++;
      } else {
        context.consecutive_same_errors = 1;
      }

      if (this.retryHelper.shouldRetry(error, context)) {
        const delay = this.retryHelper.calculateDelay(context.attempt);
        this.logger.warn(
          `Retrying getRunsList in ${delay}ms (attempt ${context.attempt}/3) - Error: ${errorCode}`,
        );

        await this.retryHelper.sleep(delay);
        return this.getRunsListWithRetry(squidId, context);
      }

      this.logger.error(
        `Failed to fetch runs list after ${context.attempt} attempts: ${errorDetails.message}`,
        error.stack,
      );

      throw new HttpException(
        `Failed to fetch runs list: ${errorDetails.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRunDetail(runId: string): Promise<LobstrRunDetailResponse> {
    try {
      const baseUrl = this.baseUrl.endsWith('/v1')
        ? this.baseUrl
        : `${this.baseUrl}/v1`;
      const fullUrl = `${baseUrl}/runs/${runId}`;

      const headers = {
        Authorization: `Token ${this.apiKey}`,
      };

      const response = await firstValueFrom(
        this.httpService.get<LobstrRunDetailResponse>(fullUrl, {
          headers,
        }),
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch run detail: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async downloadRun(runId: string): Promise<LobstrDownloadResponse> {
    try {
      const baseUrl = this.baseUrl.endsWith('/v1')
        ? this.baseUrl
        : `${this.baseUrl}/v1`;
      const fullUrl = `${baseUrl}/runs/${runId}/download`;

      this.logger.log(
        `[DOWNLOAD] Requesting download URL for Run ID: ${runId}, URL: ${fullUrl}`,
      );

      const headers = {
        Authorization: `Token ${this.apiKey}`,
      };

      const response = await firstValueFrom(
        this.httpService.get<LobstrDownloadResponse>(fullUrl, {
          headers,
          timeout: 30000,
        }),
      );

      const downloadUrl = response.data.download_url || response.data.s3;
      this.logger.log(
        `[DOWNLOAD] Successfully obtained download URL for Run ID: ${runId}`,
      );
      this.logger.log(`[DOWNLOAD] Download URL: ${downloadUrl}`);
      this.logger.log(
        `[TEST INFO] For Swagger testing - Run ID: ${runId}, Download URL: ${downloadUrl}`,
      );

      const metadata = this.retryHelper.createRequestMetadata(
        fullUrl,
        response.status,
        response.data,
        undefined,
        0,
      );
      this.retryHelper.logRequestMetadata(metadata);

      return response.data;
    } catch (error) {
      const errorDetails = LobstrErrorClassifier.extractErrorDetails(error);
      const statusCode = Number(error.response?.status) || 0;

      this.logger.error(
        `[DOWNLOAD] Failed to get download URL for Run ID: ${runId}, Status: ${statusCode}, Error: ${errorDetails.message}`,
      );

      if (statusCode === 400) {
        const errorData = error.response?.data;
        this.logger.error(
          `[DOWNLOAD] Run ID ${runId} may not be ready yet or invalid. Response: ${JSON.stringify(errorData)}`,
        );

        if (errorData?.errors?.type === 'NoResultsAvailable') {
          const noResultsError = new HttpException(
            {
              message: 'No results available yet for the specified run',
              type: 'NoResultsAvailable',
              code: 400,
              errors: errorData.errors,
            },
            HttpStatus.BAD_REQUEST,
          );
          throw noResultsError;
        }
      }

      const metadata = this.retryHelper.createRequestMetadata(
        `${this.baseUrl}/runs/${runId}/download`,
        statusCode,
        error.response?.data || error.message,
        error,
        0,
      );
      this.retryHelper.logRequestMetadata(metadata, error);

      throw new HttpException(
        `Failed to generate download URL: ${errorDetails.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRawDataList(
    runId?: string,
    pageNumber: number = 1,
    pageSize: number = 50,
  ) {
    try {
      const where: Prisma.TweetRawWhereInput = {};

      if (runId) {
        where.runId = runId;
      }

      const skip = (pageNumber - 1) * pageSize;
      const [tweets, total] = await Promise.all([
        this.prisma.tweetRaw.findMany({
          where,
          orderBy: {
            fetchedAt: 'desc',
          },
          take: pageSize,
          skip: skip,
          select: {
            id: true,
            tweetId: true,
            runId: true,
            scheduleId: true,
            authorHandle: true,
            text: true,
            createdAt: true,
            fetchedAt: true,
            isReply: true,
            isRetweet: true,
            publicMetrics: true,
            symbols: true,
            lang: true,
          },
        }),
        this.prisma.tweetRaw.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        data: tweets,
        total,
        pageNumber,
        pageSize,
        totalPages,
        hasMore: pageNumber < totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch raw data list: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to fetch raw data list: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addTasks(
    squidId: string,
    tasks: LobstrTask[],
  ): Promise<LobstrAddTasksResponse> {
    try {
      const baseUrl = this.baseUrl.endsWith('/v1')
        ? this.baseUrl
        : `${this.baseUrl}/v1`;
      const fullUrl = `${baseUrl}/tasks`;

      const headers = {
        Authorization: `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      const requestBody: LobstrAddTasksRequest = {
        tasks,
        squid: squidId,
      };

      this.logger.log(`Adding ${tasks.length} tasks to squid: ${squidId}`);

      const response = await firstValueFrom(
        this.httpService.post<LobstrAddTasksResponse>(fullUrl, requestBody, {
          headers,
        }),
      );

      this.logger.log(
        `Tasks added successfully: ${response.data.tasks.length} tasks, ${response.data.duplicated_count} duplicates`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to add tasks: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to add tasks: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTasks(squidId: string): Promise<LobstrGetTasksResponse> {
    try {
      const baseUrl = this.baseUrl.endsWith('/v1')
        ? this.baseUrl
        : `${this.baseUrl}/v1`;
      const fullUrl = `${baseUrl}/tasks?squid=${squidId}`;

      const headers = {
        Authorization: `Token ${this.apiKey}`,
      };

      const response = await firstValueFrom(
        this.httpService.get<LobstrGetTasksResponse>(fullUrl, {
          headers,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get tasks: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get tasks: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      const baseUrl = this.baseUrl.endsWith('/v1')
        ? this.baseUrl
        : `${this.baseUrl}/v1`;
      const fullUrl = `${baseUrl}/tasks/${taskId}`;

      const headers = {
        Authorization: `Token ${this.apiKey}`,
      };

      await firstValueFrom(
        this.httpService.delete(fullUrl, {
          headers,
        }),
      );

      this.logger.log(`Task ${taskId} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete task: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to delete task: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteAllTasks(squidId: string): Promise<number> {
    try {
      const tasksResponse = await this.getTasks(squidId);
      const tasks = tasksResponse.data || [];

      if (tasks.length === 0) {
        this.logger.log(`No tasks found for squid ${squidId}`);
        return 0;
      }

      this.logger.log(`Deleting ${tasks.length} tasks for squid ${squidId}`);

      const deletePromises = tasks.map((task) =>
        this.deleteTask(String(task.id)),
      );
      await Promise.all(deletePromises);

      this.logger.log(`Successfully deleted ${tasks.length} tasks`);
      return tasks.length;
    } catch (error) {
      this.logger.error(
        `Failed to delete all tasks: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to delete all tasks: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
