import { z } from 'zod';
import { ConfigKey } from './config.key';

export const configSchema = z.object({
  [ConfigKey.NODE_ENV]: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  [ConfigKey.APP_URL]: z.url(),
  [ConfigKey.DB_HOST]: z.string(),
  [ConfigKey.DB_PORT]: z.coerce.number().int().default(5432),
  [ConfigKey.DB_USER]: z.string(),
  [ConfigKey.DB_PASS]: z.string(),
  [ConfigKey.DB_NAME]: z.string(),
  [ConfigKey.REDIS_HOST]: z.string(),
  [ConfigKey.REDIS_PORT]: z.coerce.number().int().default(6379),
  [ConfigKey.REDIS_PASSWORD]: z.string(),

  [ConfigKey.KEYCLOAK_REALM]: z.string(),
  [ConfigKey.KEYCLOAK_SERVER_URL]: z.url(),
  [ConfigKey.OIDC_ISSUER]: z.string(),
  [ConfigKey.OIDC_CLIENT]: z.string(),
  [ConfigKey.OIDC_SVC_CLIENT]: z.string(),
  [ConfigKey.OIDC_SVC_CLIENT_SECRET]: z.string(),

  [ConfigKey.GATEWAY_HOST]: z.string(),
  [ConfigKey.GATEWAY_PORT]: z.string().default('8081'),

  [ConfigKey.ACCMGMT_MS_HOST]: z.string(),
  [ConfigKey.ACCMGMT_MS_PORT]: z.string().default('8082'),
});

export type AppConfig = z.infer<typeof configSchema>;
