import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AppUser,
  ConfigKey,
  Department,
  LoggerLike,
  LoggerModule,
  RpcContextInterceptor,
} from '@slamint/core';
import Keyv from 'keyv';
import { TicketingController } from './ticketing.controller';
import { TicketingService } from './ticketing.service';

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
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (cs: ConfigService, logger: LoggerLike) => {
        const redisPassword = cs.get<string>(ConfigKey.REDIS_PASSWORD);
        const redisHost = cs.get<string>(ConfigKey.REDIS_HOST);
        const redisPort = cs.get<string>(ConfigKey.REDIS_PORT);
        const url = `redis://:${redisPassword}@${redisHost}:${redisPort}/0`;

        const keyvRedis = new KeyvRedis(url);

        const keyv = new Keyv({
          store: keyvRedis,
          namespace: 'slamint-ticketmgmt',
          ttl: 14400 * 1000,
        });
        keyv.on('error', (e) =>
          logger?.error?.({
            msg: 'KeyvRedis error',
            err: e?.message ?? String(e),
          })
        );

        logger?.info?.({
          msg: 'cache_wiring',
          url,
          namespace: 'slamint-ticketmgmt',
        });

        return { stores: [keyv] };
      },
    }),
    TypeOrmModule.forFeature([AppUser, Department]),
    LoggerModule,
  ],
  controllers: [TicketingController],
  providers: [TicketingService, RpcContextInterceptor],
})
export class TicketingModule {}
