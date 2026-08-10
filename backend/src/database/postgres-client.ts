import { Client } from 'pg';
import { config } from '../config.js';

console.log('Connecting to database...');

const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
};
console.log('Database configuration:', dbConfig);

const client = new Client(dbConfig);

export const postgresClient = client;
