import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule, FirstTimeUserInterceptor } from '@slamint/auth';
import {
  AllExceptionFilter,
  AuditInspector,
  AuditLog,
  AuditService,
  ConfigKey,
  LoggerModule,
  LoggingInterceptor,
  MicroserviceClientsModule,
  RequestIdMiddleware,
  ResponseInterceptor,
} from '@slamint/core';

import { join } from 'path';
import { AppController } from './app.controller';
import { AccMgmtController } from './controllers';
import { AccMgmtControllerPrivileged } from './controllers/accMgmtPrivileged.controller';
import { DepartmentController } from './controllers/department.controller';
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
  controllers: [
    AppController,
    AccMgmtController,
    AccMgmtControllerPrivileged,
    DepartmentController,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: FirstTimeUserInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInspector },
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    AuditService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
