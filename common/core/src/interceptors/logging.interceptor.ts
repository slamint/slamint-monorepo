import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';
import { getRequestContext, LOGGER } from '../logging';
import { Inject } from '@nestjs/common';
import type { LoggerLike } from './rcpContext.interceptors';

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
    const requestId =
      (typeof ridHeader === 'string'
        ? ridHeader
        : Array.isArray(ridHeader)
        ? ridHeader[0]
        : undefined) ?? getRequestContext()?.requestId;

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
          this.logger.error({
            msg: 'http_response_error',
            method,
            path,
            status: res.statusCode,
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
