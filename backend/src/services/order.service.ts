import { OrderRepository, Order } from '../repositories/order.repository.js';
import { redisClient } from '../database/redis-client.js';

const ORDER_CACHE_KEY = 'orders:all';

export class OrderService {
  constructor(private repository = new OrderRepository()) {}

  async init() {
    await this.repository.init();
  }

  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const created = await this.repository.create(order);
    await redisClient.del(ORDER_CACHE_KEY);
    return created;
  }

  async listOrders(): Promise<Order[]> {
    const cached = await redisClient.get(ORDER_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as Order[];
    }

    const orders = await this.repository.findAll();
    await redisClient.set(ORDER_CACHE_KEY, JSON.stringify(orders), { EX: 30 });
    return orders;
  }

  async getOrderById(id: number): Promise<Order | null> {
    return this.repository.findById(id);
  }
}
