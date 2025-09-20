import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable, Subscriber } from 'rxjs';
import { tap } from 'rxjs/operators';

import { LOGGER, requestContext, type RequestContextStore } from '../logging';

export type LoggerLike = {
  info: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
  log?: (obj: unknown, msg?: string) => void;
};

function readPayload(rpcHost: unknown): unknown {
  if (typeof rpcHost === 'object' && rpcHost !== null) {
    const h = rpcHost as { getData?: () => unknown };
    if (typeof h.getData === 'function') return h.getData();
  }
  return undefined;
}

function readPattern(rpcHost: unknown, ctx: ExecutionContext): string {
  if (typeof rpcHost === 'object' && rpcHost !== null) {
    const h = rpcHost as { getContext?: () => unknown };
    const c = typeof h.getContext === 'function' ? h.getContext() : undefined;
    if (typeof c === 'object' && c !== null) {
      const p = (c as Record<string, unknown>)['pattern'];
      if (typeof p === 'string' && p.length) return p;
    }
  }
  const handler = ctx.getHandler?.();
  return typeof handler === 'function' && handler.name
    ? handler.name
    : 'unknown';
}

function readCtx(payload: unknown): Partial<RequestContextStore> {
  if (typeof payload !== 'object' || payload === null) return {};
  const maybe = (payload as Record<string, unknown>)['_ctx'];
  if (typeof maybe !== 'object' || maybe === null) return {};
  const v = maybe as Record<string, unknown>;
  return {
    requestId: typeof v.requestId === 'string' ? v.requestId : undefined,
    traceId: typeof v.traceId === 'string' ? v.traceId : undefined,
    spanId: typeof v.spanId === 'string' ? v.spanId : undefined,
    userId: typeof v.userId === 'string' ? v.userId : undefined,
  };
}

function toStore(ctx: Partial<RequestContextStore>): RequestContextStore {
  return {
    requestId: ctx.requestId ?? randomUUID(),
    traceId: ctx.traceId,
    spanId: ctx.spanId,
    userId: ctx.userId,
  };
}

@Injectable()
export class RpcContextInterceptor
  implements NestInterceptor<unknown, unknown>
{
  constructor(@Inject(LOGGER) private readonly logger: LoggerLike) {}

  intercept(
    ctx: ExecutionContext,
    next: CallHandler<unknown>
  ): Observable<unknown> {
    const rpc = ctx.switchToRpc();
    const payload = readPayload(rpc);
    const pattern = readPattern(rpc, ctx);

    const store = toStore(readCtx(payload));

    return new Observable<unknown>((subscriber: Subscriber<unknown>) => {
      requestContext.run(store, () => {
        const started = Date.now();
        try {
          (this.logger.info ?? this.logger.log)?.call(this.logger, {
            pattern,
            requestId: store.requestId,
            tag: 'rpc_request',
          });
        } catch {
          /* noop */
        }

        next
          .handle()
          .pipe(
            tap({
              next: () => {
                try {
                  (this.logger.info ?? this.logger.log)?.call(this.logger, {
                    pattern,
                    requestId: store.requestId,
                    durationMs: Date.now() - started,
                    tag: 'rpc_response',
                  });
                } catch {
                  /* noop */
                }
              },
              error: (err: unknown) => {
                try {
                  this.logger.error(
                    {
                      pattern,
                      requestId: store.requestId,
                      durationMs: Date.now() - started,
                      error:
                        err && typeof err === 'object'
                          ? {
                              name: (err as { name?: unknown }).name ?? '',
                              message:
                                (err as { message?: unknown }).message ?? '',
                            }
                          : { message: String(err) },
                      tag: 'rpc_error',
                    },
                    'rpc_error'
                  );
                } catch {
                  /* noop */
                }
              },
            })
          )
          .subscribe({
            next: (v: unknown) => subscriber.next(v),
            error: (e: unknown) => subscriber.error(e),
            complete: () => subscriber.complete(),
          });
      });
    });
  }
}
