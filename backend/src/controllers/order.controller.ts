import { Request as IRequest, Response } from 'express';
import { IOrderService, OrderService } from '../services/order.service.js';

const service: IOrderService = new OrderService();

interface Request extends IRequest {
  userId?: number;
}

export class OrderController {
  static async init() {
    await service.init();
  }

  static async create(req: Request, res: Response) {
    const actingUserId = req.userId ?? 1;
    const { customerName, status, total, dueDate, lineItems } = req.body;

    if (!customerName) {
      return res.status(400).json({ message: 'customerName is required' });
    }

    if (lineItems && (!Array.isArray(lineItems) || lineItems.length === 0)) {
      return res.status(400).json({ message: 'lineItems must be a non-empty array when provided' });
    }

    const order = await service.createOrder({
      customerName,
      userId: actingUserId,
      status,
      total: total ?? 0,
      dueDate,
      lineItems,
    });
    return res.status(201).json(order);
  }

  static async list(req: Request, res: Response) {
    const actingUserId = req.userId ?? 1;
    const orders = await service.listOrders(actingUserId);
    return res.json(orders);
  }

  static async operationSummary(req: Request, res: Response) {
    const actingUserId = req.userId ?? 1;
    const summary = await service.operationSummary(actingUserId);
    return res.json(summary);
  }

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const actingUserId = req.userId ?? 1;
    const order = await service.getOrderById(id);
    if (!order || order.userId !== actingUserId) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(order);
  }

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const actingUserId = req.userId ?? 1;
    const { customerName, status, total, amountPaid, dueDate, lineItems } = req.body;

    const existing = await service.getOrderById(id);
    if (!existing || existing.userId !== actingUserId) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = await service.updateOrder(id, {
      customerName,
      status,
      total,
      amountPaid,
      dueDate,
      lineItems,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or update is not allowed while order is not pending' });
    }

    return res.json(order);
  }

  static async remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const actingUserId = req.userId ?? 1;
    const existing = await service.getOrderById(id);
    if (!existing || existing.userId !== actingUserId) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const deleted = await service.deleteOrder(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(204).send();
  }
}
