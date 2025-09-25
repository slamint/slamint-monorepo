import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { LoggerLike } from '../interceptors/rcpContext.interceptors';
import { LOGGER } from '../logging';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(@Inject(LOGGER) private readonly logger: LoggerLike) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorType = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'Internal server error';
    let rawDetails: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const resp = exception.getResponse();
      rawDetails = resp;

      if (resp && typeof resp === 'object') {
        const r = resp as Record<string, any>;
        if (typeof r.errorType === 'string') errorType = r.errorType;
        if (typeof r.errorMessage === 'string') errorMessage = r.errorMessage;
        if (!r.errorType && typeof r.message === 'string')
          errorMessage = r.message;
      } else if (typeof resp === 'string') {
        errorMessage = resp;
      } else {
        errorMessage = exception.message ?? errorMessage;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message || errorMessage;
      errorType = exception.name || errorType;
    }

    this.logger.error({
      msg: 'unhandled_exception',
      method: req.method,
      path: req.originalUrl ?? req.url,
      status,
      error: {
        type: errorType,
        message: errorMessage,
        details: rawDetails,
        stack: exception instanceof Error ? exception.stack : undefined,
        name: exception instanceof Error ? exception.name : undefined,
      },
    });

    res.status(status).json({
      success: false,
      error: {
        errorCode: status,
        errorType,
        errorMessage,
      },
      path: req.originalUrl ?? req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
