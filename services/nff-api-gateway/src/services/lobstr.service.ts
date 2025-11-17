import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from './prisma.service';
import {
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
      }

      if (triggerRunDto.metadata) {
        requestBody.metadata = triggerRunDto.metadata;
      }

      const response = await firstValueFrom(
        this.httpService.post<LobstrRunResponse>(fullUrl, requestBody, {
          headers,
        }),
      );

      return response.data;
    } catch (error) {
      throw new HttpException(error.message, error.status);
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

      return response.data;
    } catch (error) {
      const errorCode = LobstrErrorClassifier.classifyError(error);

      context.last_error_code = errorCode;
      if (context.last_error_code === errorCode) {
        context.consecutive_same_errors++;
      } else {
        context.consecutive_same_errors = 1;
      }

      if (this.retryHelper.shouldRetry(error, context)) {
        const delay = this.retryHelper.calculateDelay(context.attempt);

        await this.retryHelper.sleep(delay);
        return this.getRunsListWithRetry(squidId, context);
      }

      throw new HttpException(error.message, error.status);
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

      const headers = {
        Authorization: `Token ${this.apiKey}`,
      };

      const response = await firstValueFrom(
        this.httpService.get<LobstrDownloadResponse>(fullUrl, {
          headers,
        }),
      );

      return response.data;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getRawDataList(pageNumber: number = 1, pageSize: number = 50) {
    try {
      const skip = (pageNumber - 1) * pageSize;
      const [tweets, total] = await Promise.all([
        this.prisma.tweetRaw.findMany({
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
        this.prisma.tweetRaw.count(),
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
