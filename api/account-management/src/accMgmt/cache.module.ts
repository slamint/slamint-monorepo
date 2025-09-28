import { createKeyv } from '@keyv/redis';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigKey } from '@slamint/core';
import { Cacheable } from 'cacheable';

@Module({
  providers: [
    {
      provide: CACHE_MANAGER,
      useFactory: (cs: ConfigService) => {
        const redisPassword = cs.get<string>(ConfigKey.REDIS_PASSWORD);
        const redisHost = cs.get<string>(ConfigKey.REDIS_HOST);
        const redisPort = cs.get<string>(ConfigKey.REDIS_PORT);
        const url = `redis://:${redisPassword}@${redisHost}:${redisPort}/0`;

        const keyvRedis = createKeyv(url, { namespace: 'slamint-accmgnt' });

        return new Cacheable({ secondary: keyvRedis, ttl: '4h' });
      },
    },
  ],
  exports: [CACHE_MANAGER],
})
export class CacheModule {}
