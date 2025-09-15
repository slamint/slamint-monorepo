// main.ts
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // If you log sensitive data via interceptors/filters, keep this false in prod
    bufferLogs: true,
  });

  // Global hardening
  app.enableCors({ origin: true, credentials: true });
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const port = Number(process.env.PORT) || 8081;
  await app.listen(port);
  Logger.log(`🚀 API Gateway at http://localhost:${port}/api`);
}
bootstrap();
