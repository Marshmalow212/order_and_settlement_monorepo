import { OrderStatus } from '../repositories/order.repository.js';
import {
  CreatePaymentTransactionInput,
  IPaymentTransactionRepository,
  PaymentTransaction,
  PaymentTransactionRepository,
  UpdatePaymentTransactionInput,
} from '../repositories/payment-transaction.repository.js';
import { IOrderService, OrderService } from './order.service.js';

export interface IPaymentTransactionService {
  init(): Promise<void>;
  createPaymentTransaction(input: CreatePaymentTransactionInput): Promise<PaymentTransaction>;
  listPaymentTransactions(userId?: number): Promise<PaymentTransaction[]>;
  getPaymentTransactionById(id: number): Promise<PaymentTransaction | null>;
  getPaymentTransactionsByOrderId(orderId: number, userId?: number): Promise<PaymentTransaction[]>;
  updatePaymentTransaction(id: number, data: UpdatePaymentTransactionInput): Promise<PaymentTransaction | null>;
  deletePaymentTransaction(id: number): Promise<boolean>;
}

export class PaymentTransactionService implements IPaymentTransactionService {
  constructor(
    private repository: IPaymentTransactionRepository = new PaymentTransactionRepository(),
    private orderService: IOrderService = new OrderService(),
  ) {}

  async init() {
    await this.repository.init();
  }

  async createPaymentTransaction(input: CreatePaymentTransactionInput): Promise<PaymentTransaction> {
    // validate order and amounts at service level
    const order = await this.orderService.getOrderById(Number(input.orderId));
    if (!order) throw new Error('Order not found');

    const amount = Number(input.paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0.1) throw new Error('payment amount must be greater than 0.1');

    const due = Number(order.amountDue ?? 0);
    if (amount > due) throw new Error('Payment amount exceeds due amount');

    const transaction = await this.repository.create(input);

    // update order's paid amount and recalculate totals/status
    const orderId = Number(input.orderId);
    const existingOrder = await this.orderService.getOrderById(orderId);
    const previousPaid = Number(existingOrder?.amountPaid ?? 0);
    const newPaid = previousPaid + Number(input.paymentAmount);

    // call OrderRepository to update amountPaid and recalculate totals
    const { OrderRepository, ORDER_STATUS_MAP } = await import('../repositories/order.repository.js');
    const { AuditLogRepository } = await import('../repositories/audit-log.repository.js');
    const orderRepo = new OrderRepository();
    await orderRepo.init();
    await orderRepo.update(orderId, { amountPaid: newPaid });
    const refreshed = await orderRepo.recalculateTotals(orderId);

    // create an audit log entry for this payment
    try {
      const statusNumeric = ORDER_STATUS_MAP[refreshed?.status as OrderStatus] ?? ORDER_STATUS_MAP.pending;
      await new AuditLogRepository().create({
        userId: input.userId ?? transaction.userId ?? 1,
        orderId,
        amount: Number(input.paymentAmount ?? 0),
        items: Number(refreshed?.totalItems ?? 0),
        status: Number(statusNumeric),
        lastPaymentDate: (transaction as any).paymentDate ?? new Date(),
      });
    } catch {
      // swallow audit log errors
    }

    return transaction;
  }

  async listPaymentTransactions(userId?: number): Promise<PaymentTransaction[]> {
    return this.repository.findAll(userId);
  }

  async getPaymentTransactionById(id: number): Promise<PaymentTransaction | null> {
    return this.repository.findById(id);
  }

  async getPaymentTransactionsByOrderId(orderId: number, userId?: number): Promise<PaymentTransaction[]> {
    return this.repository.findByOrderId(orderId, userId);
  }

  async updatePaymentTransaction(id: number, data: UpdatePaymentTransactionInput): Promise<PaymentTransaction | null> {
    return this.repository.update(id, data);
  }

  async deletePaymentTransaction(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }
}
