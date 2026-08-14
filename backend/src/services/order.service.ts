import {
  CreateOrderInput,
  IOrderRepository,
  Order,
  OrderRepository,
  UpdateOrderInput,
} from '../repositories/order.repository.js';

export interface IOrderService {
  init(): Promise<void>;
  createOrder(order: CreateOrderInput): Promise<Order>;
  listOrders(userId?: number): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | null>;
  updateOrder(id: number, data: UpdateOrderInput): Promise<Order | null>;
  deleteOrder(id: number): Promise<boolean>;
  operationSummary(userId: number): Promise<import('../repositories/order.repository.js').OperationSummary>;
}

export class OrderService implements IOrderService {
  constructor(private repository: IOrderRepository = new OrderRepository()) {}

  async init() {
    await this.repository.init();
  }

  async createOrder(order: CreateOrderInput): Promise<Order> {
    return this.repository.create(order);
  }

  async listOrders(userId?: number): Promise<Order[]> {
    return this.repository.findAll(userId);
  }

  async getOrderById(id: number): Promise<Order | null> {
    return this.repository.findById(id);
  }

  async updateOrder(id: number, data: UpdateOrderInput): Promise<Order | null> {
    return this.repository.update(id, data);
  }

  async deleteOrder(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  async operationSummary(userId: number): Promise<import('../repositories/order.repository.js').OperationSummary> {
    return this.repository.operationSummary(userId);
  }
}
