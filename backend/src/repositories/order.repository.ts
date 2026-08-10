import { postgresClient } from '../database/postgres-client.js';

export interface Order {
  id: number;
  customerName: string;
  status: string;
  total: number;
  createdAt: Date;
}

const ensureTable = async () => {
  await postgresClient.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      status TEXT NOT NULL,
      total NUMERIC(12,2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
};

export class OrderRepository {
  async init() {
    await ensureTable();
  }

  async create(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const result = await postgresClient.query(
      'INSERT INTO orders (customer_name, status, total) VALUES ($1, $2, $3) RETURNING id, customer_name, status, total, created_at',
      [order.customerName, order.status, order.total]
    );

    return this.mapRow(result.rows[0]);
  }

  async findAll(): Promise<Order[]> {
    const result = await postgresClient.query(
      'SELECT id, customer_name, status, total, created_at FROM orders ORDER BY created_at DESC'
    );
    return result.rows.map(this.mapRow);
  }

  async findById(id: number): Promise<Order | null> {
    const result = await postgresClient.query(
      'SELECT id, customer_name, status, total, created_at FROM orders WHERE id = $1',
      [id]
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  private mapRow(row: any): Order {
    return {
      id: row.id,
      customerName: row.customer_name,
      status: row.status,
      total: Number(row.total),
      createdAt: new Date(row.created_at),
    };
  }
}
