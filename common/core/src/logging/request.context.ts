import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  requestId: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
};

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function getRequestContext(): RequestContextStore | undefined {
  return requestContext.getStore();
}

export function withCtx<T>(data: T) {
  const c = getRequestContext();
  return {
    _ctx: c
      ? { requestId: c.requestId, traceId: c.traceId, userId: c.userId }
      : undefined,
    data,
  };
}
