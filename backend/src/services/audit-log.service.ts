import {
  AuditLog,
  AuditLogRepository,
  CreateAuditLogInput,
  IAuditLogRepository,
  UpdateAuditLogInput,
} from '../repositories/audit-log.repository.js';

export interface IAuditLogService {
  init(): Promise<void>;
  createAuditLog(input: CreateAuditLogInput): Promise<AuditLog>;
  listAuditLogs(): Promise<AuditLog[]>;
  getAuditLogById(id: number): Promise<AuditLog | null>;
  getAuditLogsByUserId(userId: number): Promise<AuditLog[]>;
  getAuditLogsByUserAndOrderId(userId: number, orderId: number): Promise<AuditLog[]>;
  updateAuditLog(id: number, data: UpdateAuditLogInput): Promise<AuditLog | null>;
  deleteAuditLog(id: number): Promise<boolean>;
}

export class AuditLogService implements IAuditLogService {
  constructor(private repository: IAuditLogRepository = new AuditLogRepository()) {}

  async init() {
    await this.repository.init();
  }

  async createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
    return this.repository.create(input);
  }

  async listAuditLogs(): Promise<AuditLog[]> {
    return this.repository.findAll();
  }

  async getAuditLogById(id: number): Promise<AuditLog | null> {
    return this.repository.findById(id);
  }

  async getAuditLogsByUserId(userId: number): Promise<AuditLog[]> {
    return this.repository.findByUserId(userId);
  }

  async getAuditLogsByUserAndOrderId(userId: number, orderId: number): Promise<AuditLog[]> {
    return this.repository.findByUserIdAndOrderId(userId, orderId);
  }

  async updateAuditLog(id: number, data: UpdateAuditLogInput): Promise<AuditLog | null> {
    return this.repository.update(id, data);
  }

  async deleteAuditLog(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }
}
