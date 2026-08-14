import { prisma } from '../database/prisma-client.js';
import { AuditLogRepository } from './audit-log.repository.js';

export type OrderStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue';

export const ORDER_STATUS_MAP: Record<OrderStatus, number> = {
  pending: 0,
  partially_paid: 1,
  paid: 2,
  overdue: 3,
};

export const ORDER_STATUS_LABELS: Record<number, OrderStatus> = {
  0: 'pending',
  1: 'partially_paid',
  2: 'paid',
  3: 'overdue',
};

export const normalizeOrderStatus = (value?: string | number | null): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return value >= 0 && value <= 3 ? value : undefined;
  }

  const normalized = value.trim().toLowerCase();
  const byName = Object.entries(ORDER_STATUS_MAP).find(([key]) => key === normalized);
  if (byName) {
    return byName[1];
  }

  return undefined;
};

export interface Order {
  id: number;
  customerName: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  dueDate?: Date | null;
  amountPaid?: number;
  amountDue?: number;
  totalItems?: number;
}

export interface OrderLineItemInput {
  description: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateOrderInput {
  customerName: string;
  order_status?: number | OrderStatus;
  status?: OrderStatus | number;
  total?: number;
  dueDate?: Date | string | null;
  lineItems?: OrderLineItemInput[];
}

export interface UpdateOrderInput {
  customerName?: string;
  order_status?: number | OrderStatus;
  status?: OrderStatus | number;
  total?: number;
  amountPaid?: number;
  dueDate?: Date | string | null;
  lineItems?: OrderLineItemInput[];
}

export interface IOrderRepository {
  init(): Promise<void>;
  create(order: CreateOrderInput): Promise<Order>;
  findAll(): Promise<Order[]>;
  findById(id: number): Promise<Order | null>;
  update(id: number, data: UpdateOrderInput): Promise<Order | null>;
  delete(id: number): Promise<boolean>;
  recalculateTotals(id: number): Promise<Order | null>;
}

export class OrderRepository implements IOrderRepository {
  async init() {
    await prisma.$connect();
  }

  async create(order: CreateOrderInput): Promise<Order> {
    const normalizedStatus = normalizeOrderStatus(order.order_status ?? order.status ?? 'pending');
    const created = await prisma.order.create({
      data: {
        customer_name: order.customerName,
        due_date: order.dueDate ? new Date(order.dueDate) : null,
        order_status: normalizedStatus ?? ORDER_STATUS_MAP.pending,
        amount_paid: 0,
        amount_due: 0,
        order_total: 0,
        total_items: 0,
      },
    });

    const lineItems = order.lineItems ?? [];
    if (lineItems.length > 0) {
      await prisma.lineItem.createMany({
        data: lineItems.map((item) => ({
          description: item.description.trim(),
          unit_price: Number(item.unitPrice),
          quantity: Number(item.quantity),
          orderId: created.id,
        })),
      });
    }

    const refreshed = await this.recalculateTotals(created.id);
    const final = refreshed ?? this.mapRow(created);

    // create initial audit log for order creation
    try {
      const raw = await prisma.order.findUnique({ where: { id: final.id } });
      if (raw) {
        await new AuditLogRepository().create({
          userId: null,
          orderId: raw.id,
          amount: Number(raw.order_total ?? 0),
          items: Number(raw.total_items ?? 0),
          status: Number(raw.order_status ?? ORDER_STATUS_MAP.pending),
          lastPaymentDate: null,
        });
      }
    } catch {
      // swallow audit errors to avoid blocking order creation
    }

    return final;
  }

  async findAll(): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      orderBy: { created_at: 'desc' },
    });

    return orders.map(this.mapRow);
  }

  async findById(id: number): Promise<Order | null> {
    const order = await prisma.order.findUnique({ where: { id } });
    return order ? this.mapRow(order) : null;
  }

  async update(id: number, data: UpdateOrderInput): Promise<Order | null> {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }

    if (data.lineItems && existing.order_status !== ORDER_STATUS_MAP.pending) {
      return null;
    }

    const normalizedStatus = normalizeOrderStatus(data.order_status ?? data.status);

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(data.customerName !== undefined ? { customer_name: data.customerName } : {}),
        ...(normalizedStatus !== undefined ? { order_status: normalizedStatus } : {}),
        ...(data.total !== undefined ? { order_total: Number(data.total), amount_due: Math.max(Number(data.total) - Number(data.amountPaid ?? existing.amount_paid ?? 0), 0) } : {}),
        ...(data.amountPaid !== undefined ? { amount_paid: Number(data.amountPaid) } : {}),
        ...(data.dueDate !== undefined ? { due_date: data.dueDate ? new Date(data.dueDate) : null } : {}),
      },
    }).catch(() => null);

    if (!order) return null;

    if (data.lineItems) {
      await prisma.lineItem.deleteMany({ where: { orderId: id } });
      if (data.lineItems.length > 0) {
        await prisma.lineItem.createMany({
          data: data.lineItems.map((item) => ({
            description: item.description.trim(),
            unit_price: Number(item.unitPrice),
            quantity: Number(item.quantity),
            orderId: id,
          })),
        });
      }
    }

    const refreshed = await this.recalculateTotals(id);
    return refreshed ?? this.mapRow(order);
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.order.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async recalculateTotals(id: number): Promise<Order | null> {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return null;

    const lineItems = await prisma.lineItem.findMany({ where: { orderId: id } });
    const orderTotal = lineItems.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
    const totalItems = lineItems.reduce((sum, item) => sum + item.quantity, 0);
    const amountPaid = Number(existing.amount_paid ?? 0);
    const amountDue = Math.max(orderTotal - amountPaid, 0);

    let nextStatus: OrderStatus = 'pending';
    if (orderTotal === 0) {
      nextStatus = 'pending';
    } else if (amountPaid >= orderTotal) {
      nextStatus = 'paid';
    } else if (amountPaid > 0) {
      nextStatus = 'partially_paid';
    }

    const dueDate = existing.due_date ? new Date(existing.due_date) : null;
    if (dueDate && dueDate.getTime() < Date.now() && amountDue > 0 && nextStatus !== 'paid') {
      nextStatus = 'overdue';
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        order_total: orderTotal,
        amount_due: amountDue,
        total_items: totalItems,
        order_status: ORDER_STATUS_MAP[nextStatus],
      },
    });

    // if status changed, record audit log
    try {
      if (existing.order_status !== updated.order_status) {
        await new AuditLogRepository().create({
          userId: null,
          orderId: id,
          amount: Number(orderTotal),
          items: totalItems,
          status: Number(updated.order_status),
          lastPaymentDate: null,
        });
      }
    } catch {
      // do not fail on audit errors
    }

    return this.mapRow(updated);
  }

  private mapRow(row: any): Order {
    const statusValue = Number(row.order_status ?? 0);

    return {
      id: row.id,
      customerName: row.customer_name,
      status: ORDER_STATUS_LABELS[statusValue] ?? 'pending',
      total: Number(row.order_total ?? row.total ?? 0),
      createdAt: new Date(row.created_at),
      dueDate: row.due_date ? new Date(row.due_date) : null,
      amountPaid: Number(row.amount_paid ?? 0),
      amountDue: Number(row.amount_due ?? 0),
      totalItems: Number(row.total_items ?? 0),
    };
  }
}
