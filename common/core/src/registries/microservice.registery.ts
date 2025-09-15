import {
  Transport,
  ClientsModule,
  ClientProviderOptions,
} from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { ConfigKey } from '../config/config.module';

export enum MICRO_SERVICES {
  USERS = 'USERS',
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

export const MicroserviceClientsModule = ClientsModule.registerAsync([
  {
    name: MICRO_SERVICES.USERS,
    inject: [ConfigService],
    useFactory: (cs: ConfigService) =>
      tcpClient(
        MICRO_SERVICES.USERS,
        ConfigKey.USER_MS_HOST,
        ConfigKey.USER_MS_PORT,
        cs
      ),
  },
]);
