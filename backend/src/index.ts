import express from 'express';
import cors from 'cors';
import { json, urlencoded } from 'express';
import { config } from './config.js';
import { mainRouter } from './routes/main.router.js';
import { postgresClient } from './database/postgres-client.js';
import { redisClient } from './database/redis-client.js';
import { logger, loggerMiddleware } from './logger.js';

const app = express();
const port = config.server.port;

app.use(loggerMiddleware);
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

app.use(`/api/${config.server.version}`, mainRouter);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'order-settlement-backend' });
});

const start = async () => {
  logger.info({ env: config.env, port }, 'Starting application');

  await postgresClient.connect();
  await redisClient.connect();

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
