import { Request, Response } from 'express';
import { AuthService, IAuthService } from '../services/auth.service.js';

const service: IAuthService = new AuthService();

export class AuthController {
  static async init() {
    await service.init();
  }

  static async register(req: Request, res: Response) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }

    try {
      const user = await service.register({ name, email, password });
      return res.status(201).json({ user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to register user';
      return res.status(400).json({ message });
    }
  }

  static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    try {
      const result = await service.login({ email, password });
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to login';
      return res.status(401).json({ message });
    }
  }
}
