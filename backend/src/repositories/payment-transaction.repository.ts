import { prisma } from '../database/prisma-client.js';

export interface PaymentTransaction {
  id: number;
  orderId: number;
  paymentAmount: number;
  paymentDate: Date;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentTransactionInput {
  orderId: number;
  paymentAmount: number;
  note?: string | null;
}

export interface UpdatePaymentTransactionInput {
  orderId?: number;
  paymentAmount?: number;
  note?: string | null;
}

export interface IPaymentTransactionRepository {
  init(): Promise<void>;
  create(input: CreatePaymentTransactionInput): Promise<PaymentTransaction>;
  findAll(): Promise<PaymentTransaction[]>;
  findById(id: number): Promise<PaymentTransaction | null>;
  findByOrderId(orderId: number): Promise<PaymentTransaction[]>;
  update(id: number, data: UpdatePaymentTransactionInput): Promise<PaymentTransaction | null>;
  delete(id: number): Promise<boolean>;
}

export class PaymentTransactionRepository implements IPaymentTransactionRepository {
  async init() {
    await prisma.$connect();
  }

  async create(input: CreatePaymentTransactionInput): Promise<PaymentTransaction> {
    const transaction = await prisma.paymentTransaction.create({
      data: {
        orderId: input.orderId,
        payment_amount: Number(input.paymentAmount),
        note: input.note ?? null,
      },
    });

    return this.mapRow(transaction);
  }

  async findAll(): Promise<PaymentTransaction[]> {
    const transactions = await prisma.paymentTransaction.findMany({ orderBy: { payment_date: 'desc' } });
    return transactions.map(this.mapRow);
  }

  async findById(id: number): Promise<PaymentTransaction | null> {
    const transaction = await prisma.paymentTransaction.findUnique({ where: { id } });
    return transaction ? this.mapRow(transaction) : null;
  }

  async findByOrderId(orderId: number): Promise<PaymentTransaction[]> {
    const transactions = await prisma.paymentTransaction.findMany({
      where: { orderId },
      orderBy: { payment_date: 'desc' },
    });
    return transactions.map(this.mapRow);
  }

  async update(id: number, data: UpdatePaymentTransactionInput): Promise<PaymentTransaction | null> {
    const transaction = await prisma.paymentTransaction.update({
      where: { id },
      data: {
        ...(data.orderId !== undefined ? { orderId: data.orderId } : {}),
        ...(data.paymentAmount !== undefined ? { payment_amount: Number(data.paymentAmount) } : {}),
        ...(data.note !== undefined ? { note: data.note ?? null } : {}),
      },
    }).catch(() => null);

    return transaction ? this.mapRow(transaction) : null;
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.paymentTransaction.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  private mapRow(row: any): PaymentTransaction {
    return {
      id: row.id,
      orderId: row.orderId,
      paymentAmount: Number(row.payment_amount),
      paymentDate: new Date(row.payment_date),
      note: row.note ?? null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
