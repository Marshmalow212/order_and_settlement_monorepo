import {
  CreateLineItemInput,
  ILineItemRepository,
  LineItem,
  LineItemRepository,
  UpdateLineItemInput,
} from '../repositories/line-item.repository.js';

export interface ILineItemService {
  init(): Promise<void>;
  createLineItem(input: CreateLineItemInput): Promise<LineItem>;
  listLineItems(): Promise<LineItem[]>;
  getLineItemById(id: number): Promise<LineItem | null>;
  getLineItemsByOrderId(orderId: number): Promise<LineItem[]>;
  updateLineItem(id: number, data: UpdateLineItemInput): Promise<LineItem | null>;
  deleteLineItem(id: number): Promise<boolean>;
}

export class LineItemService implements ILineItemService {
  constructor(private repository: ILineItemRepository = new LineItemRepository()) {}

  async init() {
    await this.repository.init();
  }

  async createLineItem(input: CreateLineItemInput): Promise<LineItem> {
    return this.repository.create(input);
  }

  async listLineItems(): Promise<LineItem[]> {
    return this.repository.findAll();
  }

  async getLineItemById(id: number): Promise<LineItem | null> {
    return this.repository.findById(id);
  }

  async getLineItemsByOrderId(orderId: number): Promise<LineItem[]> {
    return this.repository.findByOrderId(orderId);
  }

  async updateLineItem(id: number, data: UpdateLineItemInput): Promise<LineItem | null> {
    return this.repository.update(id, data);
  }

  async deleteLineItem(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }
}
