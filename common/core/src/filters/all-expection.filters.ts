import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LOGGER } from '../logging';
import type { LoggerLike } from '../interceptors/rcpContext.interceptors';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(@Inject(LOGGER) private readonly logger: LoggerLike) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const resp = exception.getResponse();
      details = resp;

      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        const maybeMsg = (resp as Record<string, unknown>).message;
        if (Array.isArray(maybeMsg)) {
          message = maybeMsg.join(', ');
        } else if (typeof maybeMsg === 'string') {
          message = maybeMsg;
        } else {
          message = exception.message;
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }
    this.logger.error({
      msg: 'unhandled_exception',
      method: req.method,
      path: req.originalUrl ?? req.url,
      status,
      error: {
        message,
        details,
        // If you want full stack in logs, remove redaction for error.stack in logger module
        stack: exception instanceof Error ? exception.stack : undefined,
        name: exception instanceof Error ? exception.name : undefined,
      },
    });
    res.status(status).json({
      success: false,
      error: {
        message,
        details,
      },
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
