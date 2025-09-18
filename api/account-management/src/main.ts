import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AccountManagement } from './accMgmt/accMgmt.module';
import { ConfigService } from '@nestjs/config';
import { ConfigKey, RpcContextInterceptor, LOGGER } from '@slamint/core';

async function bootstrap() {
  const appCtx = await NestFactory.createApplicationContext(AccountManagement);

  const cs = appCtx.get(ConfigService);
  const host = cs.get<string>(ConfigKey.ACCMGMT_MS_HOST) ?? '127.0.0.1';
  const port = Number(cs.get<string>(ConfigKey.ACCMGMT_MS_PORT) ?? 8082);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AccountManagement,
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
  Logger.log(`🔒 Account Management is running on: http://${host}:${port}`);
}

bootstrap();
