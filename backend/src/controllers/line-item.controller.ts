import { Request, Response } from 'express';
import { ILineItemService, LineItemService } from '../services/line-item.service.js';

const service: ILineItemService = new LineItemService();

export class LineItemController {
  static async init() {
    await service.init();
  }

  static async create(req: Request, res: Response) {
    const { description, unitPrice, quantity, orderId } = req.body;

    if (!description || unitPrice == null || quantity == null || orderId == null) {
      return res.status(400).json({ message: 'description, unitPrice, quantity, and orderId are required' });
    }

    const item = await service.createLineItem({ description, unitPrice, quantity, orderId });
    return res.status(201).json(item);
  }

  static async list(_req: Request, res: Response) {
    const items = await service.listLineItems();
    return res.json(items);
  }

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const item = await service.getLineItemById(id);
    if (!item) {
      return res.status(404).json({ message: 'Line item not found' });
    }

    return res.json(item);
  }

  static async getByOrderId(req: Request, res: Response) {
    const orderId = Number(req.params.orderId);
    if (Number.isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'Invalid orderId parameter' });
    }

    const items = await service.getLineItemsByOrderId(orderId);
    return res.json(items);
  }

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const item = await service.updateLineItem(id, req.body);
    if (!item) {
      return res.status(404).json({ message: 'Line item not found' });
    }

    return res.json(item);
  }

  static async remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const deleted = await service.deleteLineItem(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Line item not found' });
    }

    return res.status(204).send();
  }
}
