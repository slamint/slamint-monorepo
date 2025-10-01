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
    return json.length > 2000 ? json.slice(0, 2000) + '…' : json;
  } catch {
    return '[unserializable]';
  }
}

function normalizeException(exception: unknown): {
  status: number;
  errorType: string;
  errorMessage: string;
  details?: unknown;
} {
  let status = HttpStatus.INTERNAL_SERVER_ERROR;
  let errorType = 'INTERNAL_SERVER_ERROR';
  let errorMessage = 'Internal server error';
  let details: unknown;

  if (exception instanceof HttpException) {
    status = exception.getStatus();
    const resp = exception.getResponse();
    details = resp;

    if (typeof resp === 'object' && resp !== null) {
      const r = resp as Record<string, any>;
      if (typeof r.errorType === 'string') errorType = r.errorType;
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

  return { status, errorType, errorMessage, details };
}

function toHttpMeta(req: Request, status: number) {
  return {
    method: req.method,
    path: (req.originalUrl ?? req.url) as string,
    status,
    headers: pickSafeHeaders(req),
    bodyPreview: safeBodyPreview(req),
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
  };
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(@Inject(LOGGER) private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { requestId, traceId, userId } = getRequestContext() ?? {};

    const norm = normalizeException(exception);
    const httpMeta = toHttpMeta(req, norm.status);

    // 1) Log a structured error (pino JSON)
    this.logger.error({
      msg: 'unhandled_exception',
      requestId,
      traceId,
      userId,
      http: httpMeta,
      error: {
        type: norm.errorType,
        message: norm.errorMessage,
        details: norm.details,
        name: exception instanceof Error ? exception.name : undefined,
        // stack: exception instanceof Error ? exception.stack : undefined,
      },
    });

    // 2) Return a clean client response
    res.status(norm.status).json({
      success: false,
      error: {
        errorCode: norm.status,
        errorType: norm.errorType,
        errorMessage: norm.errorMessage,
      },
      path: httpMeta.path,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  /* ----------------- Helpers ----------------- */
}
