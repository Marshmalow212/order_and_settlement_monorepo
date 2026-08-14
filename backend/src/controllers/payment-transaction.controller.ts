import { Request, Response } from 'express';
import { IPaymentTransactionService, PaymentTransactionService } from '../services/payment-transaction.service.js';
import { IOrderService, OrderService } from '../services/order.service.js';

const service: IPaymentTransactionService = new PaymentTransactionService();
const orderService: IOrderService = new OrderService();

export class PaymentTransactionController {
  static async init() {
    await service.init();
    await orderService.init();
  }

  static async create(req: Request, res: Response) {
    const actingUserId = req.userId ?? 1;
    const { orderId, paymentAmount, note } = req.body;

    if (orderId == null || paymentAmount == null) {
      return res.status(400).json({ message: 'orderId and paymentAmount are required' });
    }

    // validate order exists and amount due
    const order = await orderService.getOrderById(Number(orderId));
    if (!order) return res.status(400).json({ message: 'Order not found' });
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0.1) {
      return res.status(400).json({ message: 'paymentAmount must be greater than 0.1' });
    }
    const due = Number(order.amountDue ?? 0);
    if (amount > due) {
      return res.status(400).json({ message: 'Payment amount exceeds amount due' });
    }

    try {
      const transaction = await service.createPaymentTransaction({ orderId, paymentAmount, note, userId: actingUserId });
      return res.status(201).json(transaction);
    } catch (err: any) {
      return res.status(400).json({ message: err?.message ?? 'Invalid payment' });
    }
  }

  static async list(req: Request, res: Response) {
    const actingUserId = req.userId ?? 1;
    const transactions = await service.listPaymentTransactions(actingUserId);
    return res.json(transactions);
  }

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const actingUserId = req.userId ?? 1;
    const transaction = await service.getPaymentTransactionById(id);
    if (!transaction || transaction.userId !== actingUserId) {
      return res.status(404).json({ message: 'Payment transaction not found' });
    }

    return res.json(transaction);
  }

  static async getByOrderId(req: Request, res: Response) {
    const orderId = Number(req.params.orderId);
    if (Number.isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'Invalid orderId parameter' });
    }

    const actingUserId = req.userId ?? 1;
    const transactions = await service.getPaymentTransactionsByOrderId(orderId, actingUserId);
    return res.json(transactions);
  }

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const actingUserId = req.userId ?? 1;
    const existing = await service.getPaymentTransactionById(id);
    if (!existing || existing.userId !== actingUserId) {
      return res.status(404).json({ message: 'Payment transaction not found' });
    }

    const transaction = await service.updatePaymentTransaction(id, req.body);
    if (!transaction) {
      return res.status(404).json({ message: 'Payment transaction not found' });
    }

    return res.json(transaction);
  }

  static async remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const actingUserId = req.userId ?? 1;
    const existing = await service.getPaymentTransactionById(id);
    if (!existing || existing.userId !== actingUserId) {
      return res.status(404).json({ message: 'Payment transaction not found' });
    }

    const deleted = await service.deletePaymentTransaction(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Payment transaction not found' });
    }

    return res.status(204).send();
  }
}
