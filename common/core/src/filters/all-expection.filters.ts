import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Logger } from 'pino';
import { getRequestContext, LOGGER } from '../logging';

const SAFE_REQ_HEADERS = [
  'x-request-id',
  'traceparent',
  'x-source',
  'user-agent',
  'referer',
  'content-type',
  'accept',
];

function pickSafeHeaders(req: Request) {
  const out: Record<string, unknown> = {};
  for (const k of SAFE_REQ_HEADERS) {
    const v = req.headers[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function safeBodyPreview(req: Request) {
  if (!req.body || req.method === 'GET') return undefined;

  try {
    const json = JSON.stringify(req.body);
    return json.length > 2_000 ? json.slice(0, 2_000) + '…' : json;
  } catch {
    return '[unserializable]';
  }
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(@Inject(LOGGER) private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { requestId, traceId, userId } = getRequestContext() ?? {};

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorType = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'Internal server error';
    let details: unknown = undefined;

    // Normalize HttpException, Validation errors, etc.
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();

      details = resp;

      if (resp && typeof resp === 'object') {
        const r = resp as Record<string, any>;
        errorType = typeof r.errorType === 'string' ? r.errorType : errorType;
        if (typeof r.errorMessage === 'string') {
          errorMessage = r.errorMessage;
        } else if (typeof r.message === 'string') {
          errorMessage = r.message;
        } else if (Array.isArray(r.message)) {
          // class-validator array
          errorType = 'VALIDATION_ERROR';
          errorMessage = 'Validation failed';
          details = { issues: r.message };
        }
      } else if (typeof resp === 'string') {
        errorMessage = resp;
      } else {
        errorMessage = exception.message ?? errorMessage;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message || errorMessage;
      errorType = exception.name || errorType;
    }

    // 1) Log a structured error for machines (pino JSON)
    this.logger.error({
      msg: 'unhandled_exception',
      requestId,
      traceId,
      userId,
      http: {
        method: req.method,
        path: req.originalUrl ?? req.url,
        status,
        headers: pickSafeHeaders(req),
        bodyPreview: safeBodyPreview(req),
        ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      },
      error: {
        type: errorType,
        message: errorMessage,
        details,
        name: exception instanceof Error ? exception.name : undefined,
        // stack: exception instanceof Error ? exception.stack : undefined,
      },
    });

    // 2) Return a clean client response
    res.status(status).json({
      success: false,
      error: {
        errorCode: status,
        errorType,
        errorMessage,
      },
      path: req.originalUrl ?? req.url,
      requestId, // helpful to show to clients
      timestamp: new Date().toISOString(),
    });
  }
}
