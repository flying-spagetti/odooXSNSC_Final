/**
 * Subscription Template Service
 * Manages predefined templates used during subscription creation
 */

import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../domain/errors';

export interface CreateTemplateLineData {
  variantId: string;
  quantity: number;
  unitPrice: number;
  discountId?: string;
  taxRateId?: string;
}

export interface CreateTemplateData {
  name: string;
  validityDays: number;
  planId: string;
  description?: string;
  lines?: CreateTemplateLineData[];
}

export class TemplateService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTemplateData) {
    // Validate the plan exists
    const plan = await this.prisma.recurringPlan.findUnique({
      where: { id: data.planId },
    });
    if (!plan) {
      throw new NotFoundError('RecurringPlan', data.planId);
    }

    // Validate variant IDs if lines are provided
    if (data.lines && data.lines.length > 0) {
      const variantIds = data.lines.map((l) => l.variantId);
      const variants = await this.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
      });
      if (variants.length !== variantIds.length) {
        throw new ValidationError('One or more product variants not found');
      }
    }

    return this.prisma.subscriptionTemplate.create({
      data: {
        name: data.name,
        validityDays: data.validityDays,
        planId: data.planId,
        description: data.description,
        lines: data.lines
          ? {
              create: data.lines.map((line) => ({
                variantId: line.variantId,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                discountId: line.discountId || undefined,
                taxRateId: line.taxRateId || undefined,
              })),
            }
          : undefined,
      },
      include: {
        plan: true,
        lines: {
          include: {
            variant: { include: { product: true } },
            discount: true,
            taxRate: true,
          },
        },
      },
    });
  }

  async getById(templateId: string) {
    const template = await this.prisma.subscriptionTemplate.findUnique({
      where: { id: templateId },
      include: {
        plan: true,
        lines: {
          include: {
            variant: { include: { product: true } },
            discount: true,
            taxRate: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError('SubscriptionTemplate', templateId);
    }

    return template;
  }

  async list(filters: { isActive?: boolean; limit?: number; offset?: number }) {
    const { isActive, limit = 20, offset = 0 } = filters;

    const where = isActive !== undefined ? { isActive } : {};

    const [items, total] = await Promise.all([
      this.prisma.subscriptionTemplate.findMany({
        where,
        include: {
          plan: true,
          lines: {
            include: {
              variant: { include: { product: true } },
              discount: true,
              taxRate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.subscriptionTemplate.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async update(templateId: string, data: Partial<Omit<CreateTemplateData, 'lines'>>) {
    await this.getById(templateId); // Ensure it exists

    return this.prisma.subscriptionTemplate.update({
      where: { id: templateId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.validityDays !== undefined && { validityDays: data.validityDays }),
        ...(data.planId !== undefined && { planId: data.planId }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        plan: true,
        lines: {
          include: {
            variant: { include: { product: true } },
            discount: true,
            taxRate: true,
          },
        },
      },
    });
  }

  async delete(templateId: string) {
    await this.getById(templateId); // Ensure it exists
    // Lines are cascade-deleted
    return this.prisma.subscriptionTemplate.delete({
      where: { id: templateId },
    });
  }

  /**
   * Add a product line to an existing template
   */
  async addLine(templateId: string, line: CreateTemplateLineData) {
    await this.getById(templateId);

    return this.prisma.subscriptionTemplateLine.create({
      data: {
        templateId,
        variantId: line.variantId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountId: line.discountId || undefined,
        taxRateId: line.taxRateId || undefined,
      },
      include: {
        variant: { include: { product: true } },
        discount: true,
        taxRate: true,
      },
    });
  }

  /**
   * Remove a product line from a template
   */
  async removeLine(templateId: string, lineId: string) {
    await this.getById(templateId);

    return this.prisma.subscriptionTemplateLine.delete({
      where: { id: lineId },
    });
  }
}
