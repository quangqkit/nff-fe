import {
  HttpException,
  Injectable,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LobstrService } from './lobstr.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WindowScheduleService } from './window-schedule.service';
import { TweetClassificationService } from './tweet-classification.service';
import { StoryService } from './story.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  private readonly pythonServiceUrl: string;

  constructor(
    private readonly lobstrService: LobstrService,
    private readonly httpService: HttpService,
    private readonly windowScheduleService: WindowScheduleService,
    @Inject(forwardRef(() => TweetClassificationService))
    private readonly tweetClassificationService: TweetClassificationService,
    private readonly storyService: StoryService,
  ) {
    this.pythonServiceUrl =
      process.env.PYTHON_SERVICE_URL ||
      process.env.DATA_INGESTION_SERVICE_URL ||
      'http://localhost:8000';
  }

  @Cron('0 3 * * *', {
    timeZone: 'Asia/Jerusalem',
  })
  async handle0300Cron() {
    try {
      await this.executeScheduledTask('03:00');
    } catch (error) {
      this.logger.error(`03:00 cron failed: ${error.message}`, error.stack);
    }
  }

  @Cron('0 11 * * *', {
    timeZone: 'Asia/Jerusalem',
  })
  async handle1100Cron() {
    try {
      await this.executeScheduledTask('11:00');
    } catch (error) {
      this.logger.error(`11:00 cron failed: ${error.message}`, error.stack);
    }
  }

  @Cron('0 14 * * *', {
    timeZone: 'Asia/Jerusalem',
  })
  async handle1400Cron() {
    try {
      await this.executeScheduledTask('14:00');
    } catch (error) {
      this.logger.error(`14:00 cron failed: ${error.message}`, error.stack);
    }
  }

  @Cron('33 15 * * *', {
    timeZone: 'Asia/Jerusalem',
  })
  async handle1533Cron() {
    try {
      await this.executeScheduledTask('15:33');
    } catch (error) {
      this.logger.error(`15:33 cron failed: ${error.message}`, error.stack);
    }
  }

  // @Cron('*/1 * * * *', {
  //   timeZone: 'Asia/Jerusalem',
  // })
  // async handleTestCron() {
  //   const windowTimes = await this.windowScheduleService.getWindowTimes();
  //   if (windowTimes.length === 0) {
  //     return;
  //   }
  //   await this.executeScheduledTask(windowTimes[0]);
  // }

  async getWindowTimeByScheduleId(scheduleId: string): Promise<string | null> {
    return this.windowScheduleService.getWindowTimeByScheduleId(scheduleId);
  }

  async triggerManualFetch(scheduleId: string) {
    const windowTime =
      await this.windowScheduleService.getWindowTimeByScheduleId(scheduleId);
    if (!windowTime) {
      throw new Error(
        `Schedule ID ${scheduleId} not found in schedule configurations`,
      );
    }
    return this.executeScheduledTask(windowTime);
  }

  private async executeScheduledTask(scheduleTime: string) {
    try {
      const windowSchedule =
        await this.windowScheduleService.getWindowSchedule(scheduleTime);

      if (!windowSchedule.isActive) {
        return;
      }

      const scheduleId =
        await this.windowScheduleService.getActiveLobstrScheduleId(
          scheduleTime,
        );

      if (!scheduleId) {
        return;
      }

      const runResponse = await this.lobstrService.triggerRun({
        squidId: scheduleId,
      });

      const runId = runResponse.id;

      await this.waitForRunCompletion(runId);

      const downloadUrl = await this.fetchDownloadUrl(runId);

      if (!downloadUrl) {
        return;
      }

      await this.dispatchRunToPython(downloadUrl, scheduleId, runId);

      try {
        await this.tweetClassificationService.classifyByRunId(runId);

        try {
          await this.storyService.groupTweetsIntoStories(runId, scheduleId);
        } catch (storyError) {
          this.logger.error(
            `Failed to group tweets into stories for run ${runId}: ${storyError.message}`,
            storyError.stack,
          );
        }
      } catch (classifyError) {
        this.logger.error(
          `Failed to classify tweets for run ${runId}: ${classifyError.message}`,
          classifyError.stack,
        );
      }
    } catch (error) {
      this.logger.error(
        `Scheduled task failed for window ${scheduleTime}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  private async fetchDownloadUrl(runId: string): Promise<string | null> {
    const downloadResponse = await this.lobstrService.downloadRun(runId);
    const downloadUrl = downloadResponse.download_url || downloadResponse.s3;
    if (!downloadUrl) {
      return null;
    }
    return downloadUrl;
  }

  private async waitForRunCompletion(runId: string): Promise<void> {
    const maxWaitMs = Number(process.env.LOBSTR_RUN_TIMEOUT_MS || 120000);
    const pollIntervalMs = Number(process.env.LOBSTR_RUN_POLL_MS || 5000);
    const deadline = Date.now() + maxWaitMs;
    let lastStatus: string | undefined;

    while (Date.now() <= deadline) {
      try {
        const runDetail = await this.lobstrService.getRunDetail(runId);
        lastStatus = runDetail.status;
        const normalizedStatus = (runDetail.status || '').toLowerCase();

        if (normalizedStatus === 'done' || normalizedStatus === 'completed') {
          return;
        }
      } catch {
        // Ignore errors during polling, will retry on next iteration
      }

      await this.delay(pollIntervalMs);
    }

    throw new Error(
      `Run ${runId} did not reach completed state within ${Math.ceil(
        maxWaitMs / 1000,
      )}s (last status: ${lastStatus ?? 'unknown'})`,
    );
  }

  private async dispatchRunToPython(
    downloadUrl: string,
    scheduleId: string,
    runId: string,
  ): Promise<void> {
    const url = `${this.pythonServiceUrl}/api/v1/lobstr/jobs`;
    const payload = {
      download_url: downloadUrl,
      schedule_id: scheduleId,
      run_id: runId,
    };

    try {
      await firstValueFrom(
        this.httpService.post(url, payload, {
          timeout: 600000,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to dispatch run ${runId} to python: ${error.message}`,
      );
      throw error;
    }
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
