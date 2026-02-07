/**
 * Subscription Service
 * Manages subscription lifecycle with state machine enforcement
 */

import { PrismaClient, Subscription, SubscriptionLine } from '@prisma/client';
import {
  NotFoundError,
  InvalidTransitionError,
  ValidationError,
  BusinessRuleError,
} from '../domain/errors';
import {
  SubscriptionStatus,
  canTransitionSubscription,
  SubscriptionActions,
} from '../domain/state-machines';
import { AuditService } from './audit.service';
import { generateSubscriptionNumber } from '../utils/generators';
import { calculateNextBillingDate } from '../domain/pricing';
import { MoreHorizontal } from 'lucide-react';

export interface CreateSubscriptionData {
  userId: string;
  planId: string;
  notes?: string;
  quotationTemplate?: string;
  expirationDate?: string;
  paymentTermDays?: number;
  paymentMethod?: string;
  salespersonId?: string;
}

export interface UpdateSubscriptionData {
  quotationTemplate?: string;
  expirationDate?: string;
  paymentTermDays?: number;
  paymentMethod?: string;
  paymentDone?: boolean;
  salespersonId?: string;
  notes?: string;
}

export interface AddLineData {
  variantId: string;
  quantity: number;
  unitPrice: number;
  discountId?: string;
  taxRateId?: string;
  notes?: string;
}


interface MoreAddLineData extends AddLineData {
  productId: "Product1",
  variantId: string;
  quantity: number;
  unitPrice: number;
  discountId?: string;
  taxRateId?: string;
  notes?: string;
}



export class SubscriptionService {
  private auditService: AuditService;

  constructor(private prisma: PrismaClient) {
    this.auditService = new AuditService(prisma);
  }

  /**
   * Create a new subscription in DRAFT status
   */
  async create(data: CreateSubscriptionData, actorUserId: string,)
  
  {
    // Verify plan exists
    const plan = await this.prisma.recurringPlan.findUnique({
      where: { id: data.planId },
    });

    if (!plan) {
      throw new NotFoundError('RecurringPlan', data.planId);
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundError('User', data.userId);
    }

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          subscriptionNumber: generateSubscriptionNumber(),
          userId: data.userId,
          planId: data.planId,
          status: 'DRAFT',
          notes: data.notes,
          quotationTemplate: data.quotationTemplate,
          expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
          paymentTermDays: data.paymentTermDays,
          paymentMethod: data.paymentMethod as any,
          salespersonId: data.salespersonId,
        },
        include: {
          plan: true,
          user: { select: { id: true, email: true, name: true } },
          salesperson: { select: { id: true, email: true, name: true } },
        },
      });

      await this.auditService.log(
        {
          userId: actorUserId,
          entityType: 'SUBSCRIPTION',
          entityId: subscription.id,
          action: 'CREATED',
          newValue: { status: subscription.status },
        },
        this.prisma
      );

      return subscription;
    });
  }

  /**
   * Add a line item to a subscription (only allowed in DRAFT or QUOTATION)
   */
  async addLine(subscriptionId: string, data: AddLineData, actorUserId: string) {
    const subscription = await this.getById(subscriptionId);

    if (!['DRAFT', 'QUOTATION'].includes(subscription.status)) {
      throw new BusinessRuleError(
        'Lines can only be added to subscriptions in DRAFT or QUOTATION status'
      );
    }

    // Verify variant exists
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: data.variantId },
    });

    if (!variant) {
      throw new NotFoundError('ProductVariant', data.variantId);
    }

    return this.prisma.$transaction(async (tx) => {
      const line = await tx.subscriptionLine.create({
        data: {
          subscriptionId,
          variantId: data.variantId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          discountId: data.discountId,
          taxRateId: data.taxRateId,
          notes: data.notes,
        },
        include: {
          variant: true,
          discount: true,
          taxRate: true,
        },
      });

      await this.auditService.log(
        {
          userId: actorUserId,
          entityType: 'SUBSCRIPTION',
          entityId: subscriptionId,
          action: 'LINE_ADDED',
          newValue: { lineId: line.id, variantId: data.variantId, quantity: data.quantity },
        },
        tx
      );

      return line;
    });
  }

  /**
   * Transition subscription to QUOTATION
   */
  async actionQuote(subscriptionId: string, actorUserId: string) {
    return this.transition(subscriptionId, 'QUOTATION', actorUserId);
  }

  /**
   * Transition subscription to CONFIRMED
   * Sets start date if not set
   */
  async actionConfirm(subscriptionId: string, actorUserId: string, startDate?: Date) {
    const subscription = await this.getById(subscriptionId);

    // Validate has lines
    const lineCount = await this.prisma.subscriptionLine.count({
      where: { subscriptionId },
    });

    if (lineCount === 0) {
      throw new BusinessRuleError('Cannot confirm subscription without line items');
    }

    return this.prisma.$transaction(async (tx) => {
      const effectiveStartDate = startDate || subscription.startDate || new Date();

      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CONFIRMED',
          startDate: effectiveStartDate,
          orderDate: new Date(), // Set order date when confirmed
        },
        include: {
          plan: true,
          user: { select: { id: true, email: true, name: true } },
          salesperson: { select: { id: true, email: true, name: true } },
          lines: {
            include: {
              variant: { include: { product: true } },
              discount: true,
              taxRate: true,
            },
          },
        },
      });

      await this.auditService.logStatusChange(
        actorUserId,
        'SUBSCRIPTION',
        subscriptionId,
        subscription.status,
        'CONFIRMED',
        tx
      );

      return updated;
    });
  }

  /**
   * Transition subscription to ACTIVE
   * Sets next billing date
   */
  async actionActivate(subscriptionId: string, actorUserId: string) {
    const subscription = await this.getById(subscriptionId, { plan: true });

    if (!subscription.startDate) {
      throw new BusinessRuleError('Cannot activate subscription without start date');
    }

    return this.prisma.$transaction(async (tx) => {
      const nextBillingDate = calculateNextBillingDate(
        subscription.startDate,
        subscription.plan.billingPeriod,
        subscription.plan.intervalCount
      );

      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE',
          nextBillingDate,
        },
        include: {
          plan: true,
          user: { select: { id: true, email: true, name: true } },
          salesperson: { select: { id: true, email: true, name: true } },
          lines: {
            include: {
              variant: { include: { product: true } },
              discount: true,
              taxRate: true,
            },
          },
        },
      });

      await this.auditService.logStatusChange(
        actorUserId,
        'SUBSCRIPTION',
        subscriptionId,
        subscription.status,
        'ACTIVE',
        this.prisma
      );

      return updated;
    });
  }

  /**
   * Transition subscription to CLOSED
   */
  async actionClose(subscriptionId: string, actorUserId: string, endDate?: Date) {
    const subscription = await this.getById(subscriptionId);

    if (!['QUOTATION', 'CONFIRMED', 'ACTIVE'].includes(subscription.status)) {
      throw new BusinessRuleError(
        'Subscription can only be closed from QUOTATION, CONFIRMED, or ACTIVE status'
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CLOSED',
          endDate: endDate || new Date(),
        },
        include: {
          plan: true,
        },
      });

      await this.auditService.logStatusChange(
        actorUserId,
        'SUBSCRIPTION',
        subscriptionId,
        subscription.status,
        'CLOSED',
        this.prisma
      );

      return updated;
    });
  }

  /**
   * Update subscription fields (only in DRAFT / QUOTATION / CONFIRMED)
   */
  async update(subscriptionId: string, data: UpdateSubscriptionData, actorUserId: string) {
    const subscription = await this.getById(subscriptionId);

    if (!['DRAFT', 'QUOTATION', 'CONFIRMED'].includes(subscription.status)) {
      throw new BusinessRuleError(
        'Subscription can only be updated in DRAFT, QUOTATION, or CONFIRMED status'
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          quotationTemplate: data.quotationTemplate,
          expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
          paymentTermDays: data.paymentTermDays,
          paymentMethod: data.paymentMethod as any,
          paymentDone: data.paymentDone,
          salespersonId: data.salespersonId,
          notes: data.notes,
        },
        include: {
          plan: true,
          user: { select: { id: true, email: true, name: true } },
          salesperson: { select: { id: true, email: true, name: true } },
          lines: {
            include: {
              variant: { include: { product: true } },
              discount: true,
              taxRate: true,
            },
          },
        },
      });

      await this.auditService.log(
        {
          userId: actorUserId,
          entityType: 'SUBSCRIPTION',
          entityId: subscriptionId,
          action: 'UPDATED',
          newValue: data as any,
        },
        this.prisma
      );

      return updated;
    });
  }

  /**
   * Delete a subscription (only allowed in DRAFT status)
   */
  async delete(subscriptionId: string, actorUserId: string) {
    const subscription = await this.getById(subscriptionId);

    if (subscription.status !== 'DRAFT') {
      throw new BusinessRuleError('Only DRAFT subscriptions can be deleted');
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete all lines first
      await tx.subscriptionLine.deleteMany({
        where: { subscriptionId },
      });

      // Delete the subscription
      await tx.subscription.delete({
        where: { id: subscriptionId },
      });

      await this.auditService.log(
        {
          userId: actorUserId,
          entityType: 'SUBSCRIPTION',
          entityId: subscriptionId,
          action: 'DELETED',
          newValue: { subscriptionNumber: subscription.subscriptionNumber },
        },
        this.prisma
      );

      return true;
    });
  }

  /**
   * Cancel subscription (from QUOTATION or CONFIRMED → back to DRAFT)
   */
  async actionCancel(subscriptionId: string, actorUserId: string) {
    const subscription = await this.getById(subscriptionId);

    if (!['QUOTATION', 'CONFIRMED', 'ACTIVE'].includes(subscription.status)) {
      throw new BusinessRuleError(
        'Subscription can only be cancelled from QUOTATION, CONFIRMED, or ACTIVE status'
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CLOSED',
          endDate: new Date(),
        },
        include: {
          plan: true,
        },
      });

      await this.auditService.logStatusChange(
        actorUserId,
        'SUBSCRIPTION',
        subscriptionId,
        subscription.status,
        'CLOSED',
        this.prisma
      );

      return updated;
    });
  }

  /**
   * Renew a subscription → creates a new DRAFT subscription with same order lines
   * Works from CONFIRMED, ACTIVE, or CLOSED states
   */
  async actionRenew(subscriptionId: string, actorUserId: string) {
    const subscription = await this.getById(subscriptionId, {
      plan: true,
      lines: {
        include: {
          variant: true,
          discount: true,
          taxRate: true,
        },
      },
    });

    if (subscription.status === 'DRAFT') {
      throw new BusinessRuleError('DRAFT subscriptions cannot be renewed');
    }

    if (!['CONFIRMED', 'ACTIVE', 'CLOSED'].includes(subscription.status)) {
      throw new BusinessRuleError('Subscription can only be renewed from CONFIRMED, ACTIVE, or CLOSED status');
    }

    return this.prisma.$transaction(async (tx) => {
      // Get plan details
      const plan = await tx.recurringPlan.findUnique({
        where: { id: subscription.planId },
      });

      if (!plan) {
        throw new NotFoundError('RecurringPlan', subscription.planId);
      }

      // Get subscription lines
      const lines = await tx.subscriptionLine.findMany({
        where: { subscriptionId },
        include: {
          variant: true,
          discount: true,
          taxRate: true,
        },
      });

      // Compute dates for the renewed subscription
      const now = new Date();
      // Use current date or subscription's expiration date as base for next billing
      const baseDate = subscription.expirationDate ? new Date(subscription.expirationDate) : now;
      const nextBillingDate = calculateNextBillingDate(
        baseDate,
        plan.billingPeriod,
        plan.intervalCount
      );

      // Create new subscription based on old one
      const newSubscription = await tx.subscription.create({
        data: {
          subscriptionNumber: generateSubscriptionNumber(),
          userId: subscription.userId,
          planId: subscription.planId,
          status: 'DRAFT',
          startDate: now,
          orderDate: now, // Order date is set to current date
          nextBillingDate, // Next invoice date computed based on plan
          quotationTemplate: subscription.quotationTemplate,
          paymentTermDays: subscription.paymentTermDays,
          paymentMethod: subscription.paymentMethod,
          salespersonId: subscription.salespersonId,
          notes: `Renewed from ${subscription.subscriptionNumber}`,
        },
      });

      // Copy line items
      if (lines && lines.length > 0) {
        for (const line of lines) {
          await tx.subscriptionLine.create({
            data: {
              subscriptionId: newSubscription.id,
              variantId: line.variantId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              discountId: line.discountId,
              taxRateId: line.taxRateId,
            },
          });
        }
      }

      const result = await tx.subscription.findUnique({
        where: { id: newSubscription.id },
        include: {
          plan: true,
          user: { select: { id: true, email: true, name: true } },
          salesperson: { select: { id: true, email: true, name: true } },
          lines: {
            include: {
              variant: { include: { product: true } },
              discount: true,
              taxRate: true,
            },
          },
        },
      });

      await this.auditService.log(
        {
          userId: actorUserId,
          entityType: 'SUBSCRIPTION',
          entityId: newSubscription.id,
          action: 'RENEWED',
          newValue: { renewedFrom: subscriptionId },
        },
        tx
      );

      return result;
    });
  }

  /**
   * Get subscription by ID
   */
  async getById(subscriptionId: string, include?: Record<string, unknown>) {
    const defaultInclude: any = {
      plan: true,
      user: { select: { id: true, email: true, name: true } },
      salesperson: { select: { id: true, email: true, name: true } },
      lines: {
        include: {
          variant: { include: { product: true } },
          discount: true,
          taxRate: true,
        },
      },
      invoices: {
        orderBy: { createdAt: 'desc' as const },
      },
    };

    const finalInclude = include ? { ...defaultInclude, ...include } : defaultInclude;

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: finalInclude,
    });

    if (!subscription) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    return subscription;
  }

  /**
   * List subscriptions with pagination
   */
  async list(filters: {
    userId?: string;
    status?: SubscriptionStatus;
    limit?: number;
    offset?: number;
  }) {
    const { userId, status, limit = 20, offset = 0 } = filters;

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        include: {
          plan: true,
          user: { select: { id: true, email: true, name: true } },
          salesperson: { select: { id: true, email: true, name: true } },
          lines: {
            include: {
              discount: true,
              taxRate: true,
            },
          },
          _count: { select: { lines: true, invoices: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Internal method to transition subscription status
   */
  private async transition(
    subscriptionId: string,
    toStatus: SubscriptionStatus,
    actorUserId: string
  ) {
    const subscription = await this.getById(subscriptionId);

    if (!canTransitionSubscription(subscription.status as SubscriptionStatus, toStatus)) {
      throw new InvalidTransitionError('Subscription', subscription.status, toStatus);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: { status: toStatus },
        include: {
          plan: true,
        },
      });

      await this.auditService.logStatusChange(
        actorUserId,
        'SUBSCRIPTION',
        subscriptionId,
        subscription.status,
        toStatus,
        tx
      );

      return updated;
    });
  }
}

async function PrintMoreAddLineData(moreAddLineData: MoreAddLineData) {
  console.log(moreAddLineData);
}
PrintMoreAddLineData()