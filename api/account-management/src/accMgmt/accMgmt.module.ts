import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  AppUser,
  ConfigKey,
  Department,
  LoggerModule,
  RpcContextInterceptor,
} from '@slamint/core';

import { AccountManagementController } from './accMgmt.controller';
import { AccountManagementService } from './accMgmt.service';
import { DepartmentControler } from './department.controller';
import { DepartmentService } from './department.service';

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
    TypeOrmModule.forFeature([AppUser, Department]),
    LoggerModule,
  ],
  controllers: [AccountManagementController, DepartmentControler],
  providers: [
    AccountManagementService,
    DepartmentService,
    RpcContextInterceptor,
  ],
})
export class AccountManagement {}
