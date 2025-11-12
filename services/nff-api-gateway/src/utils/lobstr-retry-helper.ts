import { Logger } from '@nestjs/common';
import {
  RetryConfig,
  LobstrRetryContext,
  RequestMetadata,
} from '../types/lobstr.interface';
import { LobstrErrorClassifier } from './lobstr-error-classifier';

export class LobstrRetryHelper {
  private readonly logger = new Logger(LobstrRetryHelper.name);

  private readonly defaultRetryConfig: RetryConfig = {
    max_attempts: 3,
    base_delay_ms: 1000,
    max_delay_ms: 60000,
    backoff_multiplier: 2,
  };

  calculateDelay(
    attempt: number,
    config: RetryConfig = this.defaultRetryConfig,
  ): number {
    const delay =
      config.base_delay_ms * Math.pow(config.backoff_multiplier, attempt - 1);
    return Math.min(delay, config.max_delay_ms);
  }

  shouldRetry(
    error: any,
    context: LobstrRetryContext,
    config: RetryConfig = this.defaultRetryConfig,
  ): boolean {
    if (context.attempt >= config.max_attempts) {
      this.logger.warn(`Max retry attempts (${config.max_attempts}) reached`);
      return false;
    }

    const errorCode = LobstrErrorClassifier.classifyError(error);

    if (!LobstrErrorClassifier.isRetryable(errorCode)) {
      this.logger.warn(`Error ${errorCode} is not retryable`);
      return false;
    }

    if (
      LobstrErrorClassifier.shouldBackoff(errorCode, context.last_error_code)
    ) {
      context.consecutive_same_errors++;

      if (context.consecutive_same_errors >= 3) {
        this.logger.warn(
          `Stopping retry after 3 consecutive ${errorCode} errors`,
        );
        return false;
      }
    } else {
      context.consecutive_same_errors = 1;
    }

    return true;
  }

  createRequestMetadata(
    endpoint: string,
    statusCode: number,
    responseBody: any,
    error?: any,
    retryCount: number = 0,
  ): RequestMetadata {
    const errorCode = error
      ? LobstrErrorClassifier.classifyError(error)
      : undefined;

    return {
      endpoint,
      request_id: this.generateRequestId(),
      status_code: statusCode,
      response_body: responseBody,
      timestamp: new Date(),
      error_code: errorCode,
      retry_count: retryCount,
    };
  }

  logRequestMetadata(metadata: RequestMetadata, error?: any): void {
    const logData = {
      request_id: metadata.request_id,
      endpoint: metadata.endpoint,
      status_code: metadata.status_code,
      error_code: metadata.error_code,
      retry_count: metadata.retry_count,
      timestamp: metadata.timestamp.toISOString(),
    };

    if (error) {
      this.logger.error(
        `Request failed: ${JSON.stringify(logData)}`,
        error.stack,
      );
    } else {
      this.logger.log(`Request successful: ${JSON.stringify(logData)}`);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
