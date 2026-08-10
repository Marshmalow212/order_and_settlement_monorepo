import { Request, Response } from 'express';
import { OrderService } from '../services/order.service.js';

const service = new OrderService();

export class OrderController {
  static async init() {
    await service.init();
  }

  static async create(req: Request, res: Response) {
    const { customerName, status, total } = req.body;

    if (!customerName || !status || total == null) {
      return res.status(400).json({ message: 'customerName, status, and total are required' });
    }

    const order = await service.createOrder({ customerName, status, total });
    return res.status(201).json(order);
  }

  static async list(_req: Request, res: Response) {
    const orders = await service.listOrders();
    return res.json(orders);
  }

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const order = await service.getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(order);
  }
}
