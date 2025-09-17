import { Module, Global } from '@nestjs/common';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { getRequestContext } from './request.context';

export const LOGGER = Symbol('LOGGER');
export const HTTP_LOGGER = Symbol('HTTP_LOGGER');

@Global()
@Module({
  providers: [
    {
      provide: LOGGER,
      useFactory: () => {
        return pino({
          level: process.env.LOG_LEVEL || 'info',
          transport: {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              colorize: false,
              messageKey: 'msg',
              errorLikeObjectKeys: [],
              translateTime: false,
              levelFirst: false,
            },
          },
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'body.password',
              'body.client_secret',
              'error.stack',
            ],
            censor: '<<REDACTED>>',
          },
          base: undefined,
          timestamp: pino.stdTimeFunctions.isoTime,
          hooks: {
            logMethod(rawArgs, method) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const args = Array.from(rawArgs as unknown as any[]) as unknown[];

              if (args.length === 0) args.push({});

              const isRecord = (v: unknown): v is Record<string, unknown> =>
                typeof v === 'object' && v !== null && !Array.isArray(v);

              const ctx = getRequestContext();
              if (ctx) {
                const patch = {
                  requestId: ctx.requestId,
                  traceId: ctx.traceId,
                  spanId: ctx.spanId,
                  userId: ctx.userId,
                } as const;

                if (isRecord(args[0])) Object.assign(args[0], patch);
                else args.unshift({ ...patch });
              }

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              method.apply(this, args as any);
            },
          },
        });
      },
    },
    {
      provide: HTTP_LOGGER,
      useFactory: () => pinoHttp({ autoLogging: false }),
    },
  ],
  exports: [LOGGER, HTTP_LOGGER],
})
export class LoggerModule {}
