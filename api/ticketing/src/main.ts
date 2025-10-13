import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigKey, RpcContextInterceptor } from '@slamint/core';
import { TicketingModule } from './app/ticketing.module';

async function bootstrap() {
  const appCtx = await NestFactory.createApplicationContext(TicketingModule);

  const cs = appCtx.get(ConfigService);
  const host = cs.get<string>(ConfigKey.TICKETING_MS_HOST) ?? '127.0.0.1';
  const port = Number(cs.get<string>(ConfigKey.TICKETING_MS_PORT) ?? 8083);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TicketingModule,
    {
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
    }
  );
  const interceptor = app.get(RpcContextInterceptor);
  app.useGlobalInterceptors(interceptor);

  await app.listen();
  Logger.log(`🧾 Ticket Management is running on: http://${host}:${port}`);
}

bootstrap(); // NOSONAR: top-level await requires ESM; this project uses CommonJS.
