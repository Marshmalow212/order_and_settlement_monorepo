import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from './config.js';

const createLogger = (pino as any).default ?? pino;
const createPinoHttp = (pinoHttp as any).default ?? pinoHttp;

export const logger = createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
});

export const loggerMiddleware = createPinoHttp({ logger });
