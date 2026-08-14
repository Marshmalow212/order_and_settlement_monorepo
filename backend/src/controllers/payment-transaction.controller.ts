import { Request, Response } from 'express';
import { IPaymentTransactionService, PaymentTransactionService } from '../services/payment-transaction.service.js';

const service: IPaymentTransactionService = new PaymentTransactionService();

export class PaymentTransactionController {
  static async init() {
    await service.init();
  }

  static async create(req: Request, res: Response) {
    const { orderId, paymentAmount, note } = req.body;

    if (orderId == null || paymentAmount == null) {
      return res.status(400).json({ message: 'orderId and paymentAmount are required' });
    }

    const transaction = await service.createPaymentTransaction({ orderId, paymentAmount, note });
    return res.status(201).json(transaction);
  }

  static async list(_req: Request, res: Response) {
    const transactions = await service.listPaymentTransactions();
    return res.json(transactions);
  }

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const transaction = await service.getPaymentTransactionById(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Payment transaction not found' });
    }

    return res.json(transaction);
  }

  static async getByOrderId(req: Request, res: Response) {
    const orderId = Number(req.params.orderId);
    if (Number.isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'Invalid orderId parameter' });
    }

    const transactions = await service.getPaymentTransactionsByOrderId(orderId);
    return res.json(transactions);
  }

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
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

    const deleted = await service.deletePaymentTransaction(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Payment transaction not found' });
    }

    return res.status(204).send();
  }
}
