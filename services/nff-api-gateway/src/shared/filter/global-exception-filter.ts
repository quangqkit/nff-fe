import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as {
        message: string;
        error: string;
        code: string;
      };

      message = exceptionResponse.message || exception.message;
    } else {
      // Log unexpected errors with full details
      this.logger.error(
        `Unexpected error occurred: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
        exception instanceof Error ? exception.stack : exception,
        {
          url: request.url,
          method: request.method,
          body: request.body
            ? JSON.stringify(request.body).substring(0, 1000)
            : 'No body',
        },
      );
    }

    const ignoredPaths = [
      '/.well-known/appspecific/com.chrome.devtools.json',
      '/favicon.ico',
    ];

    if (!ignoredPaths.includes(request.url)) {
      this.logger.error(
        `Request failed: ${request.method} ${request.url} - Status: ${status}`,
        {
          status,
          message,
          url: request.url,
          method: request.method,
        },
      );
    }

    response.status(status).json({
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
