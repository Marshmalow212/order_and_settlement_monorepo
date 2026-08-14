import {
  CreatePaymentTransactionInput,
  IPaymentTransactionRepository,
  PaymentTransaction,
  PaymentTransactionRepository,
  UpdatePaymentTransactionInput,
} from '../repositories/payment-transaction.repository.js';

export interface IPaymentTransactionService {
  init(): Promise<void>;
  createPaymentTransaction(input: CreatePaymentTransactionInput): Promise<PaymentTransaction>;
  listPaymentTransactions(): Promise<PaymentTransaction[]>;
  getPaymentTransactionById(id: number): Promise<PaymentTransaction | null>;
  getPaymentTransactionsByOrderId(orderId: number): Promise<PaymentTransaction[]>;
  updatePaymentTransaction(id: number, data: UpdatePaymentTransactionInput): Promise<PaymentTransaction | null>;
  deletePaymentTransaction(id: number): Promise<boolean>;
}

export class PaymentTransactionService implements IPaymentTransactionService {
  constructor(private repository: IPaymentTransactionRepository = new PaymentTransactionRepository()) {}

  async init() {
    await this.repository.init();
  }

  async createPaymentTransaction(input: CreatePaymentTransactionInput): Promise<PaymentTransaction> {
    return this.repository.create(input);
  }

  async listPaymentTransactions(): Promise<PaymentTransaction[]> {
    return this.repository.findAll();
  }

  async getPaymentTransactionById(id: number): Promise<PaymentTransaction | null> {
    return this.repository.findById(id);
  }

  async getPaymentTransactionsByOrderId(orderId: number): Promise<PaymentTransaction[]> {
    return this.repository.findByOrderId(orderId);
  }

  async updatePaymentTransaction(id: number, data: UpdatePaymentTransactionInput): Promise<PaymentTransaction | null> {
    return this.repository.update(id, data);
  }

  async deletePaymentTransaction(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }
}
