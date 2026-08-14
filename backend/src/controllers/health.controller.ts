import { prisma } from '../database/prisma-client.js';
import { logger } from '../logger.js';

export class HealthController {
  static async check(req: any, res: any) {
    try {
      const dbResult = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now`;

      const services = {
        database: {
          status: 'ok',
          response: dbResult[0]?.now,
        },
      };

      res.status(200).json({
        status: 'ok',
        services,
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Health check failed');
      res.status(500).json({ status: 'error', message: error?.message ?? 'Health check failed' });
    } finally {
      logger.info('Health check completed');
    }
  }
}