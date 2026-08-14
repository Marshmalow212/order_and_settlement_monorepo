import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  env: string;
  server: {
    port: number;
    version: string;
  };
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    url: string;
  };
  redis: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
}

export const config: AppConfig = {
  env: process.env.NODE_ENV ?? 'development',
  server: {
    port: Number(process.env.PORT ?? 3000),
    version: process.env.API_VERSION ?? 'v1',
  },
  database: {
    host: process.env.POSTGRES_HOST ?? 'postgresdb',
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    database: process.env.POSTGRES_DB ?? 'order_settlement_db',
    user: process.env.POSTGRES_USER ?? 'marsh_local',
    password: process.env.POSTGRES_PASSWORD ?? 'Marsh@123',
    url: process.env.DATABASE_URL ?? 'postgresql://marsh_local:Marsh@123@localhost:5432/order_settlement_db?schema=public',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'redis',
    port: Number(process.env.REDIS_PORT ?? 6379),
    username: process.env.REDIS_USER ?? 'marsh_local',
    password: process.env.REDIS_PASSWORD ?? 'secret',
  },
};
