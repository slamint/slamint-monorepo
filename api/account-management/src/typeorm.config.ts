import 'dotenv/config';
import { DataSource } from 'typeorm';
import { AppUser, Department } from '../../../common/core/dist/src/entities';

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
