import { Client } from 'pg';
import { config } from '../config.js';
import { logger } from '../logger.js';

logger.info('Connecting to Postgres database');

const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
};
logger.debug({ dbConfig: { ...dbConfig, password: '******' } }, 'Database configuration');

const client = new Client(dbConfig);

export const postgresClient = client;
