import { HttpException } from '@nestjs/common';
import {
  LobstrErrorCode,
  LobstrErrorResponse,
} from '../types/lobstr.interface';

export class LobstrErrorClassifier {
  static classifyError(error: any): LobstrErrorCode {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      return this.classifyByStatus(status);
    }

    if (error.response) {
      const status = error.response.status;
      return this.classifyByStatus(Number(status));
    }

    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT'
    ) {
      return LobstrErrorCode.NETWORK_ERROR;
    }

    return LobstrErrorCode.UNKNOWN;
  }

  private static classifyByStatus(status: number): LobstrErrorCode {
    switch (status) {
      case 401:
      case 403:
        return LobstrErrorCode.AUTHENTICATION;

      case 429:
        return LobstrErrorCode.RATE_LIMIT;

      case 400:
      case 422:
        return LobstrErrorCode.VALIDATION;

      case 500:
      case 502:
      case 503:
      case 504:
        return LobstrErrorCode.SERVER_ERROR;

      default:
        return LobstrErrorCode.UNKNOWN;
    }
  }

  static extractErrorDetails(error: any): LobstrErrorResponse {
    let code = 'UNKNOWN';
    let message = error.message || 'Unknown error';
    let details = null;
    let request_id: string | undefined = undefined;

    if (error.response?.data) {
      const responseData = error.response.data;
      code = responseData.code || responseData.error || 'UNKNOWN';
      message = responseData.message || responseData.detail || message;
      details = responseData.details || responseData;
      request_id = responseData.request_id || responseData.id;
    }

    return {
      code,
      message,
      details,
      request_id,
    };
  }

  static isRetryable(errorCode: LobstrErrorCode): boolean {
    const retryableErrors = [
      LobstrErrorCode.RATE_LIMIT,
      LobstrErrorCode.SERVER_ERROR,
      LobstrErrorCode.NETWORK_ERROR,
    ];

    return retryableErrors.includes(errorCode);
  }

  static shouldBackoff(
    currentError: LobstrErrorCode,
    lastError?: LobstrErrorCode,
  ): boolean {
    return !!lastError && currentError === lastError;
  }
}
