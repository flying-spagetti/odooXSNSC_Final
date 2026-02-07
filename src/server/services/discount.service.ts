/**
 * Discount Service
 * Manages discount configurations
 */

import { PrismaClient, Decimal } from '@prisma/client';
import { NotFoundError, BusinessRuleError } from '../domain/errors';

export interface CreateDiscountData {
  name: string;
  code?: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  maxUses?: number;
  maxUsesPerUser?: number;
  minPurchaseAmount?: number;
  applicableProductIds?: string[];
}

export interface ValidateDiscountCodeData {
  code: string;
  cartItems: Array<{ variantId: string; quantity: number; unitPrice: number }>;
  userId?: string;
}

export interface ValidateDiscountResult {
  valid: boolean;
  discount?: any;
  discountAmount?: number;
  message?: string;
}

export class DiscountService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateDiscountData) {
    // Validate date range if both dates provided
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      throw new BusinessRuleError('Start date must be before end date');
    }

    // Validate code uniqueness if provided
    if (data.code) {
      const existing = await this.prisma.discount.findFirst({
        where: { code: data.code },
      });
      if (existing) {
        throw new BusinessRuleError('Discount code already exists');
      }
    }

    return this.prisma.discount.create({
      data: {
        name: data.name,
        code: data.code,
        type: data.type,
        value: data.value,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        maxUses: data.maxUses,
        maxUsesPerUser: data.maxUsesPerUser,
        minPurchaseAmount: data.minPurchaseAmount,
        applicableProductIds: data.applicableProductIds || [],
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

  async list(filters: { isActive?: boolean; limit?: number; offset?: number }) {
    const { isActive = true, limit = 100, offset = 0 } = filters;

    const where = isActive !== undefined ? { isActive } : {};

    const [items, total] = await Promise.all([
      this.prisma.discount.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.discount.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async update(discountId: string, data: Partial<CreateDiscountData>) {
    // Validate date range if both dates provided
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      throw new BusinessRuleError('Start date must be before end date');
    }

    // Validate code uniqueness if provided
    if (data.code) {
      const existing = await this.prisma.discount.findFirst({
        where: { code: data.code, id: { not: discountId } },
      });
      if (existing) {
        throw new BusinessRuleError('Discount code already exists');
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.maxUsesPerUser !== undefined) updateData.maxUsesPerUser = data.maxUsesPerUser;
    if (data.minPurchaseAmount !== undefined) updateData.minPurchaseAmount = data.minPurchaseAmount;
    if (data.applicableProductIds !== undefined) updateData.applicableProductIds = data.applicableProductIds;

    return this.prisma.discount.update({
      where: { id: discountId },
      data: updateData,
    });
  }

  async deactivate(discountId: string) {
    return this.prisma.discount.update({
      where: { id: discountId },
      data: { isActive: false },
    });
  }

  /**
   * Validate discount code with cart context
   */
  async validateDiscountCode(data: ValidateDiscountCodeData): Promise<ValidateDiscountResult> {
    const { code, cartItems, userId } = data;

    // Find discount by code
    const discount = await this.prisma.discount.findFirst({
      where: { code },
    });

    if (!discount) {
      return {
        valid: false,
        message: 'Invalid discount code',
      };
    }

    // Check if discount is active
    if (!discount.isActive) {
      return {
        valid: false,
        message: 'This discount code is no longer active',
      };
    }

    // Check validity dates
    const now = new Date();
    if (discount.startDate && now < discount.startDate) {
      return {
        valid: false,
        message: 'This discount code is not yet valid',
      };
    }
    if (discount.endDate && now > discount.endDate) {
      return {
        valid: false,
        message: 'This discount code has expired',
      };
    }

    // Check total usage limit
    if (discount.maxUses !== null && discount.maxUses !== undefined) {
      const totalUses = await this.prisma.discountUsage.count({
        where: { discountId: discount.id },
      });
      if (totalUses >= discount.maxUses) {
        return {
          valid: false,
          message: 'This discount code has reached its maximum usage limit',
        };
      }
    }

    // Check per-user usage limit
    if (userId && discount.maxUsesPerUser !== null && discount.maxUsesPerUser !== undefined) {
      const userUses = await this.prisma.discountUsage.count({
        where: {
          discountId: discount.id,
          userId,
        },
      });
      if (userUses >= discount.maxUsesPerUser) {
        return {
          valid: false,
          message: 'You have reached the maximum usage limit for this discount code',
        };
      }
    }

    // Calculate cart total
    let cartTotal = 0;
    const productIds = new Set<string>();

    for (const item of cartItems) {
      const itemTotal = item.quantity * parseFloat(item.unitPrice.toString());
      cartTotal += itemTotal;

      // Get product ID from variant
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
        select: { productId: true },
      });
      if (variant) {
        productIds.add(variant.productId);
      }
    }

    // Check minimum purchase amount
    if (discount.minPurchaseAmount !== null && discount.minPurchaseAmount !== undefined) {
      const minAmount = parseFloat(discount.minPurchaseAmount.toString());
      if (cartTotal < minAmount) {
        return {
          valid: false,
          message: `Minimum purchase amount of ₹${minAmount.toFixed(2)} required for this discount code`,
        };
      }
    }

    // Check product restrictions
    if (discount.applicableProductIds && discount.applicableProductIds.length > 0) {
      const hasApplicableProduct = Array.from(productIds).some((productId) =>
        discount.applicableProductIds!.includes(productId)
      );
      if (!hasApplicableProduct) {
        return {
          valid: false,
          message: 'This discount code is not applicable to items in your cart',
        };
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'PERCENTAGE') {
      discountAmount = cartTotal * (parseFloat(discount.value.toString()) / 100);
    } else {
      discountAmount = parseFloat(discount.value.toString());
      // Ensure discount doesn't exceed cart total
      if (discountAmount > cartTotal) {
        discountAmount = cartTotal;
      }
    }

    return {
      valid: true,
      discount,
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Record discount usage
   */
  async applyDiscountCode(discountId: string, userId: string): Promise<void> {
    await this.prisma.discountUsage.create({
      data: {
        discountId,
        userId,
      },
    });
  }

  /**
   * Get discount by code
   */
  async getByCode(code: string) {
    const discount = await this.prisma.discount.findFirst({
      where: { code },
    });

    if (!discount) {
      throw new NotFoundError('Discount', code);
    }

    return discount;
  }
}
