import { MiddlewareConsumer, Module } from '@nestjs/common';

import {
  AuditService,
  ResponseInterceptor,
  AuditInspector,
  AllExceptionFilter,
  AuditLog,
  ConfigKey,
  MicroserviceClientsModule,
  LoggingInterceptor,
  LoggerModule,
  RequestIdMiddleware,
} from '@slamint/core';
import { AuthModule, EnsureUserInterceptor } from '@slamint/auth';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';

import { AppController } from './app.controller';
import { join } from 'path';
import { AccMgmtController } from './controllers';
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'swagger-ui'),
      serveRoot: '/api/swagger-ui',
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        type: 'postgres',
        host: cs.get<string>(ConfigKey.DB_HOST),
        port: cs.get<number>(ConfigKey.DB_PORT),
        username: cs.get<string>(ConfigKey.DB_USER),
        password: cs.get<string>(ConfigKey.DB_PASS),
        database: cs.get<string>(ConfigKey.DB_NAME),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([AuditLog]),
    MicroserviceClientsModule,
    AuthModule,
    LoggerModule,
  ],
  controllers: [AppController, AccMgmtController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: EnsureUserInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInspector },
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    AuditService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
