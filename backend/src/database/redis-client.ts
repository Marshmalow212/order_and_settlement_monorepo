import { createClient } from 'redis';
import { config } from '../config.js';

const client = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: config.redis.password,
  username: config.redis.username,
});

export const redisClient = client;
