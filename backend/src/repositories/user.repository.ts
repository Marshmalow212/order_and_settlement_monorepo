import { createHash, randomBytes } from 'crypto';
import { prisma } from '../database/prisma-client.js';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
}

export interface IUserRepository {
  init(): Promise<void>;
  create(input: CreateUserInput): Promise<User>;
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: number, data: UpdateUserInput): Promise<User | null>;
  delete(id: number): Promise<boolean>;
}

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha512').update(`${salt}:${password}`).digest('hex');
  return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, storedPassword: string): boolean => {
  const [salt, hash] = storedPassword.split(':');
  if (!salt || !hash) {
    return false;
  }

  const computedHash = createHash('sha512').update(`${salt}:${password}`).digest('hex');
  return computedHash === hash;
};

export class UserRepository implements IUserRepository {
  async init() {
    await prisma.$connect();
  }

  async create(input: CreateUserInput): Promise<User> {
    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        password: hashPassword(input.password),
      },
    });

    return this.mapRow(user);
  }

  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({ orderBy: { created_at: 'desc' } });
    return users.map(this.mapRow);
  }

  async findById(id: number): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? this.mapRow(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    return user ? this.mapRow(user) : null;
  }

  async update(id: number, data: UpdateUserInput): Promise<User | null> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.email !== undefined ? { email: data.email.trim().toLowerCase() } : {}),
        ...(data.password !== undefined ? { password: hashPassword(data.password) } : {}),
      },
    }).catch(() => null);

    return user ? this.mapRow(user) : null;
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  private mapRow(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
