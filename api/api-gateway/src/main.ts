import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { HTTP_LOGGER } from '@slamint/core/logging/logger.module';

import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { ConfigKey } from '@slamint/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('SLA Mint API Gateway')
    .setDescription(
      'This API Gateway provides a unified entry point for all SLA Mint services. It exposes endpoints for health checks, authentication, and downstream service communication, and documents all possible success and error responses using OpenAPI 3.0.'
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide a valid JWT access token to authorize requests.',
      },
      'JWT Token'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger-ui', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    useGlobalPrefix: true,
  });

  app.enableCors({ origin: true, credentials: true });
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  app.use(app.get(HTTP_LOGGER));
  const configService = app.get(ConfigService);
  const port = configService.get<number>(ConfigKey.GATEWAY_PORT) ?? 8081;
  await app.listen(Number(port));
  Logger.log(`🚀 API Gateway at http://localhost:${port}/api`);
  Logger.log(`🧾 Swagger UI at http://localhost:${port}/api/swagger-ui`);
}

bootstrap();
