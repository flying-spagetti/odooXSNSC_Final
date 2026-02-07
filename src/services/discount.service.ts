/**
 * Discount Service
 * Manages discount configurations
 */

import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../domain/errors';

export interface CreateDiscountData {
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  description?: string;
}

export class DiscountService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateDiscountData) {
    return this.prisma.discount.create({
      data: {
        name: data.name,
        type: data.type,
        value: data.value,
        description: data.description,
      },
    });
  }

  async getById(discountId: string) {
    const discount = await this.prisma.discount.findUnique({
      where: { id: discountId },
    });

    if (!discount) {
      throw new NotFoundError('Discount', discountId);
    }

    return discount;
  }

  async list(filters: { isActive?: boolean }) {
    const { isActive = true } = filters;

    return this.prisma.discount.findMany({
      where: isActive !== undefined ? { isActive } : {},
      orderBy: { name: 'asc' },
    });
  }

  async update(discountId: string, data: Partial<CreateDiscountData>) {
    return this.prisma.discount.update({
      where: { id: discountId },
      data,
    });
  }

  async deactivate(discountId: string) {
    return this.prisma.discount.update({
      where: { id: discountId },
      data: { isActive: false },
    });
  }
}
