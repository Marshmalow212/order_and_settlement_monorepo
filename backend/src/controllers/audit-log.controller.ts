import { Request, Response } from 'express';
import { AuditLogService, IAuditLogService } from '../services/audit-log.service.js';

const service: IAuditLogService = new AuditLogService();

interface IRequest extends Request {
  userId?: number;
}

export class AuditLogController {
  static async init() {
    await service.init();
  }

  static async create(req: IRequest, res: Response) {
    const actingUserId = req.userId ?? 1;
    const { userId, orderId, amount, items, status, lastPaymentDate } = req.body;

    if (amount == null || items == null || status == null) {
      return res.status(400).json({ message: 'amount, items, and status are required' });
    }

    const log = await service.createAuditLog({ userId: userId ?? actingUserId, orderId, amount, items, status, lastPaymentDate });
    return res.status(201).json(log);
  }

  static async list(req: IRequest, res: Response) {
    const actingUserId = req.userId ?? 1;
    const logs = await service.listAuditLogs(actingUserId);
    return res.json(logs);
  }

  static async getById(req: IRequest, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const actingUserId = req.userId ?? 1;
    const log = await service.getAuditLogById(id);
    if (!log || log.userId !== actingUserId) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    return res.json(log);
  }

  static async getByUserId(req: IRequest, res: Response) {
    const actingUserId = req.userId ?? 1;
    const userId = Number(req.params.userId);
    if (Number.isNaN(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid userId parameter' });
    }

    if (userId !== actingUserId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const logs = await service.getAuditLogsByUserId(userId);
    return res.json(logs);
  }

  static async getByUserAndOrder(req: IRequest, res: Response) {
    const actingUserId = req.userId ?? 1;
    const userId = Number(req.params.userId);
    const orderId = Number(req.params.orderId);
    if (Number.isNaN(userId) || userId <= 0 || Number.isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'Invalid userId or orderId parameter' });
    }

    if (userId !== actingUserId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const logs = await service.getAuditLogsByUserAndOrderId(userId, orderId);
    return res.json(logs);
  }

  static async update(req: IRequest, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const actingUserId = req.userId ?? 1;
    const existing = await service.getAuditLogById(id);
    if (!existing || existing.userId !== actingUserId) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    const log = await service.updateAuditLog(id, req.body);
    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    return res.json(log);
  }

  static async remove(req: IRequest, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const actingUserId = req.userId ?? 1;
    const existing = await service.getAuditLogById(id);
    if (!existing || existing.userId !== actingUserId) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    const deleted = await service.deleteAuditLog(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    return res.status(204).send();
  }
}
