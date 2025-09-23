import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { requestContext } from './request.context';

function parseTraceparent(tp?: string) {
  if (!tp) return {};
  const parts = tp.split('-');
  if (parts.length !== 4) return {};
  const [, traceId, spanId] = parts;
  if (!/^[0-9a-f]{32}$/i.test(traceId) || !/^[0-9a-f]{16}$/i.test(spanId))
    return {};
  return { traceId, spanId };
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(
    req: Request & { user?: { sub?: string } },
    res: Response,
    next: NextFunction
  ) {
    const incomingReqId =
      (req.headers['x-request-id'] as string) || randomUUID();
    const { traceId, spanId } = parseTraceparent(
      req.headers['traceparent'] as string | undefined
    );
    const store = {
      requestId: incomingReqId,
      traceId,
      spanId,
      userId: req.user?.sub,
    };

    res.setHeader('x-request-id', incomingReqId);
    if (traceId) res.setHeader('x-trace-id', traceId);

    requestContext.enterWith(store);
    next();
  }
}
