/**
 * User Service
 * Manages user accounts and authentication
 */

import { PrismaClient, Role } from '@prisma/client';
import { NotFoundError, ConflictError, UnauthorizedError, ValidationError } from '../domain/errors';
import { hashPassword, verifyPassword } from '../utils/password';
import crypto from 'crypto';

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
        phone: true,
        address: true,
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
          phone: true,
          address: true,
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

  /**
   * Request password reset - generates and stores reset token
   * Returns true if user exists (always returns true for security)
   */
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true, message: 'If the email exists, a reset link will be sent' };
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await this.prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // In production, send email here with resetToken
    // For now, we'll return the token for testing
    return { 
      success: true, 
      message: 'If the email exists, a reset link will be sent',
      token: resetToken, // Remove this in production
    };
  }

  /**
   * Verify reset token and check if it's valid
   */
  async verifyResetToken(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token not expired
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    return user;
  }

  /**
   * Reset password with valid token
   */
  async resetPassword(token: string, newPassword: string) {
    // Verify token first
    const user = await this.verifyResetToken(token);

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }

  /**
   * Check if email exists (for forgot password validation)
   */
  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return !!user;
  }

  /**
   * Update user profile (name, phone, address)
   */
  async updateProfile(userId: string, data: { name?: string; phone?: string; address?: string }) {
    const user = await this.getById(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name ?? user.name,
        phone: data.phone,
        address: data.address,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
