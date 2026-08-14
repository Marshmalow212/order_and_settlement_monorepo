import express from 'express';
import cors from 'cors';
import { json, urlencoded } from 'express';
import { config } from './config.js';
import { prisma } from './database/prisma-client.js';
import { logger, loggerMiddleware } from './logger.js';
import { mainRouter } from './routes/main.router.js';
import actingUserMiddleware from './middleware/acting-user.middleware.js';
import { AuditLogRepository } from './repositories/audit-log.repository.js';
import { LineItemRepository } from './repositories/line-item.repository.js';
import { OrderRepository } from './repositories/order.repository.js';
import { PaymentTransactionRepository } from './repositories/payment-transaction.repository.js';
import { UserRepository } from './repositories/user.repository.js';
import { swaggerSpec } from './swagger.js';
import swaggerUi from 'swagger-ui-express';

const app = express();
const port = config.server.port;

// configure CORS for frontend(s)
const allowedOrigins = config.cors?.allowedOrigins ?? [
  'http://order-settlement-frontend:3000',
  'http://localhost:7103',
  'http://localhost:7101',
];

app.use(loggerMiddleware);
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g., curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(json());
app.use(urlencoded({ extended: true }));

// inject a static acting user for now (user id = 1)
app.use(actingUserMiddleware);

app.use(`/api/${config.server.version}`, mainRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'order-settlement-backend' });
});

const start = async () => {
  logger.info({ env: config.env, port }, 'Starting application');

  await prisma.$connect();
  await Promise.all([
    new OrderRepository().init(),
    new UserRepository().init(),
    new LineItemRepository().init(),
    new PaymentTransactionRepository().init(),
    new AuditLogRepository().init(),
  ]);

  app.listen(port, () => {
    logger.info({ url: `http://localhost:${port}` }, 'Server running');
  });
};

start().catch((error) => {
  logger.error({ err: error }, 'Unable to start server');
  if (config.env === 'development') {
    logger.debug({ stack: error.stack }, 'Startup error details');
  }
  process.exit(1);
});
