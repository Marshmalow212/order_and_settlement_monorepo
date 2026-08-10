import { postgresClient } from '../database/postgres-client.js';
import { redisClient } from '../database/redis-client.js';
import {logger} from '../logger.js';


export class HealthController {
  static async check(req: any, res: any) {
    try {
      // Check database connection
      const dbResult = await postgresClient.query('SELECT NOW()');

      // Check Redis connection
      const redisResult = await redisClient.ping();

      const services = {
        database: {
          status: 'ok',
          response: dbResult.rows[0].now,
        },
        redis: {
          status: 'ok',
          response: redisResult,
        },
      }

      res.status(200).json({ 
        status: 'ok',
        services
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Health check failed');
      res.status(500).json({ status: 'error', message: error?.message ?? 'Health check failed' });
    } finally {
      logger.info('Health check completed');
    }           
  }
}