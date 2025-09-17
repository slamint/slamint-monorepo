// common/core/src/config/config.module.ts
import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { config as dotenvLoad } from 'dotenv';
import { configSchema, AppConfig } from './config.schema';

function findDotenvUp(startDir = process.cwd()): string | undefined {
  let dir = startDir;
  // Prevent infinite loop on root (/, C:\, etc.)
  while (true) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined; // reached FS root
    dir = parent;
  }
}

function loadEnv(): AppConfig {
  const envPath = findDotenvUp();
  if (envPath) dotenvLoad({ path: envPath });

  const parsed = configSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

@Module({})
export class CoreConfigModule {
  static forRoot(): DynamicModule {
    const validated = loadEnv();
    return {
      module: CoreConfigModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          load: [() => validated],
        }),
      ],
      exports: [ConfigModule],
    };
  }
}

export { ConfigModule as NestConfigModule } from '@nestjs/config';
export { ConfigKey } from './config.key';
export type { AppConfig };
