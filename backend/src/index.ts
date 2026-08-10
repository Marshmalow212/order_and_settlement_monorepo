import express from 'express';
import cors from 'cors';
import { json, urlencoded } from 'express';
import { config } from './config.js';
import { OrderRepository } from './repositories/order.repository.js';
import { OrderService } from './services/order.service.js';
import { orderRouter } from './routes/order.routes.js';
import { postgresClient } from './database/postgres-client.js';
import { redisClient } from './database/redis-client.js';

const app = express();
const port = config.server.port;

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

app.use('/orders', orderRouter);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'order-settlement-backend' });
});

const start = async () => {
if (config.env === 'development') {
  console.log('Running in development mode');
  console.log('Environment variables:', config);
}
  await postgresClient.connect();
  await redisClient.connect();

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error('Unable to start server', error);
  if (process.env.NODE_ENV === 'development') {
    console.log('error details', error.stack);
  }
  process.exit(1);
});
