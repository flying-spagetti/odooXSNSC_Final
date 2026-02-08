/**
 * Contact Service
 * Manages contact records associated with users
 */

import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError } from '../domain/errors';

export interface CreateContactData {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateContactData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export class ContactService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateContactData) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError('User', data.userId);
    }

    // Check if email already exists for this user
    const existing = await this.prisma.contact.findFirst({
      where: {
        userId: data.userId,
        email: data.email,
      },
    });

    if (existing) {
      throw new ConflictError('Contact with this email already exists for this user');
    }

    return this.prisma.contact.create({
      data: {
        userId: data.userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async getById(contactId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundError('Contact', contactId);
    }

    return contact;
  }

  async list(filters: { userId?: string; limit?: number; offset?: number }) {
    const { userId, limit = 20, offset = 0 } = filters;

    const where = userId ? { userId } : {};

    try {
      const [items, total] = await Promise.all([
        this.prisma.contact.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            _count: {
              select: {
                subscriptions: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.contact.count({ where }),
      ]);

      return { items, total, limit, offset };
    } catch (error: any) {
      throw error;
    }
  }

  async update(contactId: string, data: UpdateContactData) {
    const contact = await this.getById(contactId);

    // If email is being updated, check for conflicts
    if (data.email && data.email !== contact.email) {
      const existing = await this.prisma.contact.findFirst({
        where: {
          userId: contact.userId,
          email: data.email,
          id: { not: contactId },
        },
      });

      if (existing) {
        throw new ConflictError('Contact with this email already exists for this user');
      }
    }

    return this.prisma.contact.update({
      where: { id: contactId },
      data: {
        name: data.name ?? contact.name,
        email: data.email ?? contact.email,
        phone: data.phone,
        address: data.address,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });
  }

  async delete(contactId: string) {
    const contact = await this.getById(contactId);

    await this.prisma.contact.delete({
      where: { id: contactId },
    });

    return { success: true };
  }

  /**
   * Get active subscriptions count for a contact
   */
  async getActiveSubscriptionsCount(contactId: string): Promise<number> {
    return this.prisma.subscription.count({
      where: {
        contactId,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Get default contact for a user (first contact created, or create one if none exists)
   */
  async getOrCreateDefaultContact(userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Get first contact for this user
    const existingContact = await this.prisma.contact.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (existingContact) {
      return existingContact;
    }

    // Create default contact from user data
    return this.prisma.contact.create({
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });
  }
}
