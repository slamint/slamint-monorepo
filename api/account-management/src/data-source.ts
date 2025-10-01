import { Department } from '@slamint/core/entities/department/department.entity';
import { AppUser } from '@slamint/core/entities/users/user.entity';
import { config } from 'dotenv';
import 'dotenv/config';
import { resolve } from 'node:path';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

config({ path: resolve(__dirname, '../../../.env') });

const env = (k: string) => {
  const v = process.env[k];
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Missing required env: ${k}`);
  }
  return v;
};

export default new DataSource({
  type: 'postgres',
  host: env('DB_HOST'),
  port: Number(process.env.DB_PORT ?? 5432),
  username: env('DB_USER'),
  password: env('DB_PASS'),
  database: env('DB_NAME'),
  entities: [AppUser, Department],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
