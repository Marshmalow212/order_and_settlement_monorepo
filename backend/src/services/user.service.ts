import {
  CreateUserInput,
  IUserRepository,
  UpdateUserInput,
  User,
  UserRepository,
} from '../repositories/user.repository.js';

export type PublicUser = Omit<User, 'password'>;

export interface IUserService {
  init(): Promise<void>;
  listUsers(): Promise<PublicUser[]>;
  getUserById(id: number): Promise<PublicUser | null>;
  createUser(input: CreateUserInput): Promise<PublicUser>;
  updateUser(id: number, data: UpdateUserInput): Promise<PublicUser | null>;
  deleteUser(id: number): Promise<boolean>;
}

const sanitizeUser = (user: User): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export class UserService implements IUserService {
  constructor(private repository: IUserRepository = new UserRepository()) {}

  async init() {
    await this.repository.init();
  }

  async listUsers(): Promise<PublicUser[]> {
    const users = await this.repository.findAll();
    return users.map(sanitizeUser);
  }

  async getUserById(id: number): Promise<PublicUser | null> {
    const user = await this.repository.findById(id);
    return user ? sanitizeUser(user) : null;
  }

  async createUser(input: CreateUserInput): Promise<PublicUser> {
    const user = await this.repository.create(input);
    return sanitizeUser(user);
  }

  async updateUser(id: number, data: UpdateUserInput): Promise<PublicUser | null> {
    const user = await this.repository.update(id, data);
    return user ? sanitizeUser(user) : null;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }
}
