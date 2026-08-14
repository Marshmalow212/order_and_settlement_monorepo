import { prisma } from '../database/prisma-client.js';

export interface LineItem {
  id: number;
  description: string;
  unitPrice: number;
  quantity: number;
  orderId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLineItemInput {
  description: string;
  unitPrice: number;
  quantity: number;
  orderId: number;
}

export interface UpdateLineItemInput {
  description?: string;
  unitPrice?: number;
  quantity?: number;
  orderId?: number;
}

export interface ILineItemRepository {
  init(): Promise<void>;
  create(input: CreateLineItemInput): Promise<LineItem>;
  findAll(): Promise<LineItem[]>;
  findById(id: number): Promise<LineItem | null>;
  findByOrderId(orderId: number): Promise<LineItem[]>;
  update(id: number, data: UpdateLineItemInput): Promise<LineItem | null>;
  delete(id: number): Promise<boolean>;
}

export class LineItemRepository implements ILineItemRepository {
  async init() {
    await prisma.$connect();
  }

  async create(input: CreateLineItemInput): Promise<LineItem> {
    const item = await prisma.lineItem.create({
      data: {
        description: input.description.trim(),
        unit_price: Number(input.unitPrice),
        quantity: input.quantity,
        orderId: input.orderId,
      },
    });

    await prisma.order.update({
      where: { id: input.orderId },
      data: {
        total_items: {
          increment: input.quantity,
        },
      },
    }).catch(() => undefined);

    const existingOrder = await prisma.order.findUnique({ where: { id: input.orderId } });
    if (existingOrder) {
      const lineItems = await prisma.lineItem.findMany({ where: { orderId: input.orderId } });
      const orderTotal = lineItems.reduce((sum, lineItem) => sum + Number(lineItem.unit_price) * lineItem.quantity, 0);
      const amountPaid = Number(existingOrder.amount_paid ?? 0);
      const amountDue = Math.max(orderTotal - amountPaid, 0);

      let status: number = 0;
      if (orderTotal === 0) status = 0;
      else if (amountPaid >= orderTotal) status = 2;
      else if (amountPaid > 0) status = 1;

      const dueDate = existingOrder.due_date ? new Date(existingOrder.due_date) : null;
      if (dueDate && dueDate.getTime() < Date.now() && amountDue > 0 && status !== 2) {
        status = 3;
      }

      await prisma.order.update({
        where: { id: input.orderId },
        data: {
          order_total: orderTotal,
          amount_due: amountDue,
          order_status: status,
          total_items: lineItems.reduce((sum, lineItem) => sum + lineItem.quantity, 0),
        },
      });
    }

    return this.mapRow(item);
  }

  async findAll(): Promise<LineItem[]> {
    const items = await prisma.lineItem.findMany({ orderBy: { created_at: 'desc' } });
    return items.map(this.mapRow);
  }

  async findById(id: number): Promise<LineItem | null> {
    const item = await prisma.lineItem.findUnique({ where: { id } });
    return item ? this.mapRow(item) : null;
  }

  async findByOrderId(orderId: number): Promise<LineItem[]> {
    const items = await prisma.lineItem.findMany({
      where: { orderId },
      orderBy: { created_at: 'desc' },
    });
    return items.map(this.mapRow);
  }

  async update(id: number, data: UpdateLineItemInput): Promise<LineItem | null> {
    const item = await prisma.lineItem.update({
      where: { id },
      data: {
        ...(data.description !== undefined ? { description: data.description.trim() } : {}),
        ...(data.unitPrice !== undefined ? { unit_price: Number(data.unitPrice) } : {}),
        ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
        ...(data.orderId !== undefined ? { orderId: data.orderId } : {}),
      },
    }).catch(() => null);

    return item ? this.mapRow(item) : null;
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.lineItem.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  private mapRow(row: any): LineItem {
    return {
      id: row.id,
      description: row.description,
      unitPrice: Number(row.unit_price),
      quantity: Number(row.quantity),
      orderId: row.orderId,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
