import {
  AppUser,
  ConfigKey,
  LoggerModule,
  RpcContextInterceptor,
} from '@slamint/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { AccountManagementController } from './accMgmt.controller';
import { AccountManagementService } from './accMgmt.service';

@Module({
  imports: [
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
    TypeOrmModule.forFeature([AppUser]),
    LoggerModule,
  ],
  controllers: [AccountManagementController],
  providers: [AccountManagementService, RpcContextInterceptor],
})
export class AccountManagement {}
