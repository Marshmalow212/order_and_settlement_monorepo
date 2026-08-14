import { createHash } from 'crypto';
import {
  CreateUserInput,
  IUserRepository,
  UserRepository,
  verifyPassword,
} from '../repositories/user.repository.js';
import { PublicUser, UserService } from './user.service.js';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  user: PublicUser;
  token: string;
}

export interface IAuthService {
  init(): Promise<void>;
  register(input: CreateUserInput): Promise<PublicUser>;
  login(credentials: AuthCredentials): Promise<LoginResult>;
}

export class AuthService implements IAuthService {
  constructor(private repository: IUserRepository = new UserRepository()) {}

  async init() {
    await this.repository.init();
  }

  async register(input: CreateUserInput): Promise<PublicUser> {
    const existingUser = await this.repository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = await this.repository.create(input);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async login(credentials: AuthCredentials): Promise<LoginResult> {
    const user = await this.repository.findByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValidPassword = verifyPassword(credentials.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const token = createHash('sha256')
      .update(`${user.email}:${user.id}:${Date.now()}`)
      .digest('hex');

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }
}
