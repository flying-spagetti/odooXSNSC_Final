/**
 * User Service
 * Manages user accounts and authentication
 */

import { PrismaClient, Role } from '@prisma/client';
import { NotFoundError, ConflictError, UnauthorizedError } from '../domain/errors';
import { hashPassword, verifyPassword } from '../utils/password';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface LoginData {
  email: string;
  password: string;
}

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateUserData) {
    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'PORTAL',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async authenticate(data: LoginData) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    const isValid = await verifyPassword(data.password, user.password);

    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async getById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return user;
  }

  async list(filters: { role?: Role; limit?: number; offset?: number }) {
    const { role, limit = 20, offset = 0 } = filters;

    const where = role ? { role } : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, limit, offset };
  }
}
