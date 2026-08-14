import { prisma } from '../database/prisma-client.js';

export interface AuditLog {
  id: number;
  userId: number | null;
  orderId: number | null;
  amount: number;
  items: number;
  status: number;
  lastPaymentDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuditLogInput {
  userId?: number | null;
  orderId?: number | null;
  amount: number;
  items: number;
  status: number;
  lastPaymentDate?: Date | null;
}

export interface UpdateAuditLogInput {
  userId?: number | null;
  orderId?: number | null;
  amount?: number;
  items?: number;
  status?: number;
  lastPaymentDate?: Date | null;
}

export interface IAuditLogRepository {
  init(): Promise<void>;
  create(input: CreateAuditLogInput): Promise<AuditLog>;
  findAll(): Promise<AuditLog[]>;
  findById(id: number): Promise<AuditLog | null>;
  findByUserId(userId: number): Promise<AuditLog[]>;
  findByUserIdAndOrderId(userId: number, orderId: number): Promise<AuditLog[]>;
  update(id: number, data: UpdateAuditLogInput): Promise<AuditLog | null>;
  delete(id: number): Promise<boolean>;
}

export class AuditLogRepository implements IAuditLogRepository {
  async init() {
    await prisma.$connect();
  }

  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const log = await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        orderId: input.orderId ?? null,
        amount: Number(input.amount),
        items: input.items,
        status: input.status,
        last_payment_date: input.lastPaymentDate ?? null,
      },
    });

    return this.mapRow(log);
  }

  async findAll(): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({ orderBy: { created_at: 'desc' } });
    return logs.map(this.mapRow);
  }

  async findById(id: number): Promise<AuditLog | null> {
    const log = await prisma.auditLog.findUnique({ where: { id } });
    return log ? this.mapRow(log) : null;
  }

  async findByUserId(userId: number): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({ where: { userId }, orderBy: { created_at: 'desc' } });
    return logs.map(this.mapRow);
  }

  async findByUserIdAndOrderId(userId: number, orderId: number): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({ where: { userId, orderId }, orderBy: { created_at: 'desc' } });
    return logs.map(this.mapRow);
  }

  async update(id: number, data: UpdateAuditLogInput): Promise<AuditLog | null> {
    const log = await prisma.auditLog.update({
      where: { id },
      data: {
        ...(data.userId !== undefined ? { userId: data.userId ?? null } : {}),
        ...(data.orderId !== undefined ? { orderId: data.orderId ?? null } : {}),
        ...(data.amount !== undefined ? { amount: Number(data.amount) } : {}),
        ...(data.items !== undefined ? { items: data.items } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.lastPaymentDate !== undefined ? { last_payment_date: data.lastPaymentDate ?? null } : {}),
      },
    }).catch(() => null);

    return log ? this.mapRow(log) : null;
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.auditLog.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  private mapRow(row: any): AuditLog {
    return {
      id: row.id,
      userId: row.userId ?? null,
      orderId: row.orderId ?? null,
      amount: Number(row.amount),
      items: Number(row.items),
      status: Number(row.status),
      lastPaymentDate: row.last_payment_date ? new Date(row.last_payment_date) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
