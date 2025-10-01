import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { getRequestContext, LOGGER } from '../logging';
import type { LoggerLike } from './rcpContext.interceptors';

function extractStatus(err: any, fallback: number): number {
  if (typeof err?.getStatus === 'function') return err.getStatus();
  if (typeof err?.status === 'number') return err.status;
  if (typeof err?.statusCode === 'number') return err.statusCode;
  if (typeof err?.response?.status === 'number') return err.response.status;
  return fallback >= 400 ? fallback : 500;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(LOGGER) private readonly logger: LoggerLike) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const started = Date.now();
    const { method, originalUrl, url, ip, headers } = req;
    const path = originalUrl ?? url;
    const ua = headers['user-agent'];
    const referer = headers['referer'] || headers['referrer'];
    const contentLength = req.headers['content-length']
      ? Number(req.headers['content-length'])
      : undefined;

    const ridHeader = req.headers['x-request-id'];
    let requestId = '';

    if (typeof ridHeader === 'string') {
      requestId = ridHeader;
    } else if (Array.isArray(ridHeader)) {
      requestId = ridHeader[0];
    } else {
      requestId = getRequestContext()?.requestId ?? '';
    }

    if (requestId && !res.getHeader('x-request-id')) {
      res.setHeader('x-request-id', requestId);
    }

    this.logger.info({
      msg: 'http_request',
      method,
      path,
      ip,
      userAgent: ua,
      referer,
      reqSize: contentLength,
      requestId,
    });

    return next.handle().pipe(
      tap({
        next: (body) => {
          const durationMs = Date.now() - started;
          const resSize = (() => {
            try {
              const s = JSON.stringify(body);
              return Buffer.byteLength(s);
            } catch {
              return undefined;
            }
          })();

          this.logger.info({
            msg: 'http_response',
            method,
            path,
            status: res.statusCode,
            durationMs,
            resSize,
            requestId,
          });
        },
        error: (err) => {
          const durationMs = Date.now() - started;
          const status = extractStatus(err, res.statusCode);

          this.logger.error({
            msg: 'http_response_error',
            method,
            path,
            status,
            durationMs,
            error: {
              message: err?.message,
              name: err?.name,
              stack: err?.stack,
              raw: err,
            },
            requestId,
          });
        },
      })
    );
  }
}
