import { Request, Response } from 'express';
import { IUserService, UserService } from '../services/user.service.js';

const service: IUserService = new UserService();

export class UserController {
  static async init() {
    await service.init();
  }

  static async list(_req: Request, res: Response) {
    const users = await service.listUsers();
    return res.json(users);
  }

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const user = await service.getUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  }

  static async create(req: Request, res: Response) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }

    try {
      const user = await service.createUser({ name, email, password });
      return res.status(201).json(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create user';
      return res.status(400).json({ message });
    }
  }

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const { name, email, password } = req.body;
    const user = await service.updateUser(id, { name, email, password });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  }

  static async remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const deleted = await service.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(204).send();
  }
}
