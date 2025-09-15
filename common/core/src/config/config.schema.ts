// common/core/src/config/config.schema.ts
import { z } from 'zod';
import { ConfigKey } from './config.key';

export const configSchema = z.object({
  [ConfigKey.NODE_ENV]: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  [ConfigKey.DB_HOST]: z.string(),
  [ConfigKey.DB_PORT]: z.coerce.number().int().default(5432),
  [ConfigKey.DB_USER]: z.string(),
  [ConfigKey.DB_PASS]: z.string(),
  [ConfigKey.DB_NAME]: z.string(),

  [ConfigKey.KEYCLOAK_REALM]: z.string(),
  [ConfigKey.KEYCLOAK_AUTH_SERVER_URL]: z.string().url(),
  [ConfigKey.KEYCLOAK_CLIENT_ID]: z.string(),
  [ConfigKey.KEYCLOAK_CLIENT_SECRET]: z.string(),
});

export type AppConfig = z.infer<typeof configSchema>;
