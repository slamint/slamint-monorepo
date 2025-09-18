import {
  Transport,
  ClientsModule,
  ClientProviderOptions,
} from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { ConfigKey } from '../config/config.module';
import { Module } from '@nestjs/common';

export enum MICRO_SERVICES {
  ACCOUNT_MANAGEMENT = 'ACCOUNT_MANAGEMENT',
}

function tcpClient(
  name: MICRO_SERVICES,
  hostEnv: string,
  portEnv: string,
  cs: ConfigService
): ClientProviderOptions {
  return {
    name,
    transport: Transport.TCP,
    options: {
      host: cs.get<string>(hostEnv, 'localhost'),
      port: cs.get<number>(portEnv, 4000),
    },
  };
}

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: MICRO_SERVICES.ACCOUNT_MANAGEMENT,
        inject: [ConfigService],
        useFactory: (cs: ConfigService) =>
          tcpClient(
            MICRO_SERVICES.ACCOUNT_MANAGEMENT,
            ConfigKey.ACCMGMT_MS_HOST,
            ConfigKey.ACCMGMT_MS_PORT,
            cs
          ),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MicroserviceClientsModule {}
