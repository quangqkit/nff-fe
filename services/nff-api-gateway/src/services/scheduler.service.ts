import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import moment from 'moment-timezone';
import { LobstrService } from './lobstr.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TradingViewService } from './tradingview.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private lastTaskAddDate: string | null = null;

  private readonly scheduleConfigs = [
    {
      scheduleId: '0a2be2e02a274c1b91669c46c3f8247b',
      windowTime: '03:00',
    },
    {
      scheduleId: '2d0df26101474db2a86b40abff6a6746',
      windowTime: '11:00',
    },
    {
      scheduleId: '5ba000d199b344969ce2c508013d152d',
      windowTime: '14:00',
    },
    {
      scheduleId: '7d007e7812c147c7abe811760950385f',
      windowTime: '15:33',
    },
  ];

  private readonly pythonServiceUrl: string;

  constructor(
    private readonly lobstrService: LobstrService,
    private readonly httpService: HttpService,
    private readonly tvService: TradingViewService,
  ) {
    this.pythonServiceUrl =
      process.env.PYTHON_SERVICE_URL ||
      process.env.DATA_INGESTION_SERVICE_URL ||
      'http://localhost:8000';
    this.logger.log(
      `[DEBUG] Python service URL configured: ${this.pythonServiceUrl}`,
    );
  }

  @Cron('0 3 * * *', {
    timeZone: 'Asia/Jerusalem',
  })
  async handle0300Cron() {
    const time = moment().tz('Asia/Jerusalem');
    await this.executeScheduledTask(time.format('HH:mm'));
  }

  @Cron('0 11 * * *', {
    timeZone: 'Asia/Jerusalem',
  })
  async handle1100Cron() {
    const time = moment().tz('Asia/Jerusalem');
    await this.executeScheduledTask(time.format('HH:mm'));
  }

  @Cron('0 14 * * *', {
    timeZone: 'Asia/Jerusalem',
  })
  async handle1400Cron() {
    const time = moment().tz('Asia/Jerusalem');
    await this.executeScheduledTask(time.format('HH:mm'));
  }

  @Cron('33 15 * * *', {
    timeZone: 'Asia/Jerusalem',
  })
  async handle1533Cron() {
    const time = moment().tz('Asia/Jerusalem');
    await this.executeScheduledTask(time.format('HH:mm'));
  }

  // @Cron('*/3 * * * *')
  // async handleTestCron() {
  //   this.logger.log('Test cron triggered - running 03:00 window');
  //   await this.executeScheduledTask('03:00');
  // }

  getWindowTimeByScheduleId(scheduleId: string): string | null {
    const config = this.scheduleConfigs.find(
      (c) => c.scheduleId === scheduleId,
    );
    return config ? config.windowTime : null;
  }

  async triggerManualFetch(scheduleId: string) {
    const windowTime = this.getWindowTimeByScheduleId(scheduleId);
    if (!windowTime) {
      this.logger.error(
        `[MANUAL] No window time found for schedule ID: ${scheduleId}`,
      );
      throw new Error(
        `Schedule ID ${scheduleId} not found in schedule configurations`,
      );
    }
    this.logger.log(
      `[MANUAL] Triggering manual fetch for schedule ${scheduleId} (window: ${windowTime})`,
    );
    return this.executeScheduledTask(windowTime);
  }

  private async executeScheduledTask(scheduleTime: string) {
    try {
      const config = this.scheduleConfigs.find(
        (c) => c.windowTime === scheduleTime,
      );
      if (!config) {
        this.logger.log(
          `No configuration found for window time: ${scheduleTime}`,
        );
        return;
      }

      this.logger.log(
        `Processing schedule ${config.scheduleId} for window ${scheduleTime}`,
      );

      const currentDate = moment().tz('Asia/Jerusalem').format('YYYY-MM-DD');
      const is0300Window = scheduleTime === '03:00';
      const isNewDay = this.lastTaskAddDate !== currentDate;

      if (is0300Window || isNewDay) {
        this.logger.log(`Fetching TradingView pre-market data`);
        const [gainers, losers] = await Promise.all([
          this.tvService.getTradingViewData('gainers'),
          this.tvService.getTradingViewData('losers'),
        ]);

        const allSymbols = Array.from(
          new Set([
            ...gainers.map((g) => g.symbol),
            ...losers.map((l) => l.symbol),
          ]),
        );

        this.logger.log(
          `Found ${allSymbols.length} unique symbols from TradingView`,
        );

        if (isNewDay && this.lastTaskAddDate !== null) {
          this.logger.log(
            `New day detected (${this.lastTaskAddDate} -> ${currentDate}), deleting existing tasks`,
          );
          await this.lobstrService.deleteAllTasks(config.scheduleId);
        }

        const tasks = allSymbols.map((symbol) => ({
          url: `https://twitter.com/search?q=${encodeURIComponent(symbol)}&src=typed_query`,
        }));

        this.logger.log(
          `Adding ${tasks.length} tasks to squid ${config.scheduleId}`,
        );
        await this.lobstrService.addTasks(config.scheduleId, tasks);
        this.lastTaskAddDate = currentDate;
        this.logger.log(
          `Tasks added successfully, last task add date: ${currentDate}`,
        );
      } else {
        this.logger.log(
          `Skipping task addition - not 03:00 window and same day (${currentDate})`,
        );
      }

      this.logger.log(
        `[SCHEDULE] Window: ${scheduleTime}, Squid ID: ${config.scheduleId}`,
      );
      this.logger.log(`Triggering run for schedule ${config.scheduleId}`);
      const runResponse = await this.lobstrService.triggerRun({
        squidId: config.scheduleId,
      });

      const runId = runResponse.id;
      this.logger.log(
        `[RUN INFO] Squid ID: ${config.scheduleId}, Run ID: ${runId}`,
      );
      this.logger.log(
        `Run triggered successfully. Run ID: ${runId}, Squid ID: ${config.scheduleId}`,
      );
      this.logger.log(
        `[TEST INFO] For Swagger testing - Squid ID: ${config.scheduleId}, Run ID: ${runId}`,
      );

      const downloadUrl = await this.getDownloadUrlWithRetry(runId);

      if (!downloadUrl) {
        this.logger.error(
          `Failed to get download URL for run ${runId} after retries, skipping database save`,
        );
        return;
      }

      this.logger.log(`Download URL obtained: ${downloadUrl}`);

      this.logger.log(
        `Calling Python service to process and save to database: ${this.pythonServiceUrl}/api/v1/lobstr/process`,
      );
      let processResponse;
      try {
        processResponse = await this.processRawDataViaPython(
          downloadUrl,
          config.scheduleId,
          runId,
        );

        this.logger.log(
          `Python service response: processed_count=${processResponse.data.processed_count}, duplicates_skipped=${processResponse.data.duplicates_skipped}`,
        );

        if (processResponse.data.processed_count === 0) {
          this.logger.warn(
            `No tweets were processed and saved to database for run ${runId}`,
          );
        } else {
          this.logger.log(
            `Successfully saved ${processResponse.data.processed_count} tweets to TweetRaw table for run ${runId}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to process and save tweets to database for run ${runId}: ${error.message}`,
          error.stack,
        );
        throw error;
      }

      await this.triggerEnrichmentPipeline(runId);

      this.logger.log(
        `Successfully processed run ${runId} for window ${scheduleTime}`,
      );
    } catch (error) {
      this.logger.error(
        `Error executing scheduled task for ${scheduleTime}:`,
        error,
      );
    }
  }

  private async getDownloadUrlWithRetry(
    runId: string,
    maxRetries: number = 30,
    retryInterval: number = 10000,
  ): Promise<string | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(
          `[DOWNLOAD] Attempting to get download URL for Run ID: ${runId} (Attempt ${attempt}/${maxRetries})`,
        );

        const downloadResponse = await this.lobstrService.downloadRun(runId);
        const downloadUrl =
          downloadResponse.download_url || downloadResponse.s3;

        if (downloadUrl) {
          this.logger.log(
            `[DOWNLOAD] Download URL obtained on attempt ${attempt}: ${downloadUrl}`,
          );
          return downloadUrl;
        }

        this.logger.log(
          `[DOWNLOAD] Download URL not available yet, retrying in ${retryInterval / 1000} seconds...`,
        );
      } catch (error) {
        let statusCode: number | undefined;
        let errorData: any;
        let errorType: string | undefined;

        if (error.response) {
          statusCode = error.response.status;
          errorData = error.response.data;
          errorType = errorData?.errors?.type;
        } else if (error.getStatus && typeof error.getStatus === 'function') {
          statusCode = error.getStatus();
          const response = error.getResponse();
          if (typeof response === 'object' && response !== null) {
            errorData = response;
            errorType = errorData?.errors?.type || errorData?.type;
          }
        }

        if (statusCode === 400 && errorType === 'NoResultsAvailable') {
          this.logger.log(
            `[DOWNLOAD] Run ID ${runId} not ready yet (NoResultsAvailable). Retrying in ${retryInterval / 1000} seconds... (Attempt ${attempt}/${maxRetries})`,
          );
        } else if (statusCode === 404) {
          this.logger.log(
            `[DOWNLOAD] Run ID ${runId} not found (404). Retrying in ${retryInterval / 1000} seconds... (Attempt ${attempt}/${maxRetries})`,
          );
        } else {
          this.logger.error(
            `[DOWNLOAD] Unexpected error getting download URL for run ${runId}: ${error.message}, Status: ${statusCode}, Type: ${errorType}`,
            error.stack,
          );
          throw error;
        }
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
    }

    this.logger.error(
      `[DOWNLOAD] Failed to get download URL for run ${runId} after ${maxRetries} attempts`,
    );
    return null;
  }

  private async processRawDataViaPython(
    downloadUrl: string,
    scheduleId: string,
    runId: string,
  ) {
    const url = `${this.pythonServiceUrl}/api/v1/lobstr/process`;
    const payload = {
      download_url: downloadUrl,
      schedule_id: scheduleId,
      run_id: runId,
    };

    this.logger.log(
      `Sending request to Python service: ${url} with payload: ${JSON.stringify(payload)}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          timeout: 600000,
        }),
      );

      this.logger.log(
        `Python service response status: ${response.status}, data: ${JSON.stringify(response.data)}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Python service request failed: ${error.message}`,
        error.response?.data || error.stack,
      );
      throw error;
    }
  }

  private async triggerEnrichmentPipeline(runId: string) {
    try {
      this.logger.log(
        `[DEBUG] Triggering enrichment pipeline for run ${runId}`,
      );

      const [gainers, losers] = await Promise.all([
        this.tvService.getTradingViewData('gainers'),
        this.tvService.getTradingViewData('losers'),
      ]);
      const marketContext = { gainers, losers };
      const enrichmentResponse = await firstValueFrom(
        this.httpService.post(
          `${this.pythonServiceUrl}/api/v1/enrichment/process`,
          {
            run_id: runId,
            market_context: marketContext,
          },
        ),
      );

      this.logger.log(
        `[DEBUG] Enrichment completed: ${enrichmentResponse.data.processed_count} tweets processed`,
      );

      const catalystResponse = await firstValueFrom(
        this.httpService.post(
          `${this.pythonServiceUrl}/api/v1/catalyst/group`,
          {
            time_window_hours: 6,
          },
        ),
      );

      this.logger.log(
        `[DEBUG] Catalyst grouping completed: ${catalystResponse.data.catalysts_created} catalysts created`,
      );
    } catch (error) {
      this.logger.error(
        `[DEBUG] Enrichment pipeline failed for run ${runId}:`,
        error,
      );
    }
  }
}
