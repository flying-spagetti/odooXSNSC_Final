/**
 * Recurring Plan Service
 * Manages subscription billing plans
 */

import { PrismaClient, BillingPeriod } from '@prisma/client';
import { NotFoundError } from '../domain/errors';

export interface CreatePlanData {
  name: string;
  billingPeriod: BillingPeriod;
  intervalCount?: number;
  description?: string;
}

export class PlanService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreatePlanData) {
    return this.prisma.recurringPlan.create({
      data: {
        name: data.name,
        billingPeriod: data.billingPeriod,
        intervalCount: data.intervalCount || 1,
        description: data.description,
      },
    });
  }

  async getById(planId: string) {
    const plan = await this.prisma.recurringPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError('RecurringPlan', planId);
    }

    return plan;
  }

  async list(filters: { isActive?: boolean; limit?: number; offset?: number }) {
    const { isActive = true, limit = 20, offset = 0 } = filters;

    const where = isActive !== undefined ? { isActive } : {};

    const [items, total] = await Promise.all([
      this.prisma.recurringPlan.findMany({
        where,
        include: {
          _count: { select: { subscriptions: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.recurringPlan.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async update(planId: string, data: Partial<CreatePlanData>) {
    return this.prisma.recurringPlan.update({
      where: { id: planId },
      data,
    });
  }
}
