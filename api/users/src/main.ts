import { NestFactory } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { ConfigKey } from '@slamint/core';

async function bootstrap() {
  const ctx = await NestFactory.createApplicationContext(UsersModule);
  const cs = ctx.get(ConfigService);

  const host = cs.get<string>(ConfigKey.USER_MS_HOST, '127.0.0.1');
  const port = cs.get<number>(ConfigKey.USER_MS_PORT, 8082);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UsersModule,
    {
      transport: Transport.TCP,
      options: { host, port },
    }
  );

  console.log(`[users-ms] listening on tcp://${host}:${port}`);
  await app.listen();
}
bootstrap();
