/**
 * Invoice Service
 * Manages invoice lifecycle with idempotent generation
 */

import { PrismaClient, Invoice } from '@prisma/client';
import {
  NotFoundError,
  InvalidTransitionError,
  BusinessRuleError,
  ConflictError,
} from '../domain/errors';
import { InvoiceStatus, canTransitionInvoice } from '../domain/state-machines';
import { AuditService } from './audit.service';
import { generateInvoiceNumber } from '../utils/generators';
import {
  calculateLineItem,
  calculateTotals,
  calculatePeriodEnd,
  calculateDueDate,
} from '../domain/pricing';

export class InvoiceService {
  private auditService: AuditService;

  constructor(private prisma: PrismaClient) {
    this.auditService = new AuditService(prisma);
  }

  /**
   * Generate invoice for a subscription period
   * IDEMPOTENT: If invoice already exists for this subscription and period, return it
   * TRANSACTIONAL: Creates invoice + lines + audit in a single transaction
   */
  async generateInvoiceForPeriod(
    subscriptionId: string,
    periodStart: Date,
    actorUserId: string
  ): Promise<Invoice> {
    // Check if invoice already exists for this period (idempotency)
    const existing = await this.prisma.invoice.findUnique({
      where: {
        subscriptionId_periodStart: {
          subscriptionId,
          periodStart,
        },
      },
      include: {
        lines: true,
        subscription: { include: { plan: true } },
      },
    });

    if (existing) {
      return existing;
    }

    // Get subscription with lines
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        lines: {
          include: {
            variant: true,
            discount: true,
            taxRate: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    if (subscription.lines.length === 0) {
      throw new BusinessRuleError('Cannot generate invoice for subscription without lines');
    }

    // Calculate period end
    const periodEnd = calculatePeriodEnd(
      periodStart,
      subscription.plan.billingPeriod,
      subscription.plan.intervalCount
    );

    const issueDate = new Date();
    const dueDate = calculateDueDate(issueDate);

    // Calculate line items and totals
    const lineCalculations = subscription.lines.map((line) =>
      calculateLineItem({
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountType: line.discount?.type as 'PERCENTAGE' | 'FIXED' | undefined,
        discountValue: line.discount?.value,
        taxRate: line.taxRate?.rate,
      })
    );

    const totals = calculateTotals(lineCalculations);

    // Create invoice with lines in a transaction
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          subscriptionId,
          status: 'DRAFT',
          periodStart,
          periodEnd,
          issueDate,
          dueDate,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          total: totals.total,
          paidAmount: 0,
        },
      });

      // Create invoice lines
      const invoiceLines = subscription.lines.map((line, index) => {
        const calc = lineCalculations[index];
        return {
          invoiceId: invoice.id,
          description: `${line.variant.name} (${line.variant.sku})`,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountAmount: calc.discountAmount,
          taxAmount: calc.taxAmount,
          lineTotal: calc.lineTotal,
        };
      });

      await tx.invoiceLine.createMany({
        data: invoiceLines,
      });

      await this.auditService.log(
        {
          userId: actorUserId,
          entityType: 'INVOICE',
          entityId: invoice.id,
          action: 'CREATED',
          newValue: {
            status: invoice.status,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
            total: totals.total,
          },
        },
        tx
      );

      // Return invoice with lines
      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          lines: true,
          subscription: { include: { plan: true } },
        },
      }) as Promise<Invoice>;
    });
  }

  /**
   * Confirm invoice (DRAFT -> CONFIRMED)
   */
  async actionConfirm(invoiceId: string, actorUserId: string) {
    return this.transition(invoiceId, 'CONFIRMED', actorUserId);
  }

  /**
   * Cancel invoice
   */
  async actionCancel(invoiceId: string, actorUserId: string) {
    return this.transition(invoiceId, 'CANCELED', actorUserId);
  }

  /**
   * Restore cancelled invoice to draft
   */
  async actionRestore(invoiceId: string, actorUserId: string) {
    return this.transition(invoiceId, 'DRAFT', actorUserId);
  }

  /**
   * Mark invoice as paid (internal, called by PaymentService)
   */
  async markPaid(invoiceId: string, actorUserId: string, tx?: PrismaClient) {
    const client = tx || this.prisma;

    const invoice = await client.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice', invoiceId);
    }

    if (!canTransitionInvoice(invoice.status as InvoiceStatus, 'PAID')) {
      throw new InvalidTransitionError('Invoice', invoice.status, 'PAID');
    }

    const updated = await client.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' },
      include: {
        lines: true,
        subscription: true,
      },
    });

    await this.auditService.logStatusChange(
      actorUserId,
      'INVOICE',
      invoiceId,
      invoice.status,
      'PAID',
      client
    );

    return updated;
  }

  /**
   * Get invoice by ID
   */
  async getById(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        lines: true,
        subscription: {
          include: {
            plan: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice', invoiceId);
    }

    return invoice;
  }

  /**
   * List invoices with pagination
   */
  async list(filters: {
    subscriptionId?: string;
    status?: InvoiceStatus;
    limit?: number;
    offset?: number;
  }) {
    const { subscriptionId, status, limit = 20, offset = 0 } = filters;

    const where: Record<string, unknown> = {};
    if (subscriptionId) where.subscriptionId = subscriptionId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          subscription: {
            include: {
              user: { select: { id: true, email: true, name: true } },
            },
          },
          _count: { select: { lines: true, payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Delete invoice (only allowed for DRAFT or CONFIRMED invoices with no payments)
   */
  async delete(invoiceId: string, actorUserId: string) {
    const invoice = await this.getById(invoiceId);

    // Only allow deletion of DRAFT or CONFIRMED invoices
    if (invoice.status !== 'DRAFT' && invoice.status !== 'CONFIRMED') {
      throw new BusinessRuleError(
        `Cannot delete invoice with status ${invoice.status}. Only DRAFT or CONFIRMED invoices can be deleted.`
      );
    }

    // Check if invoice has payments
    const paymentCount = await this.prisma.payment.count({
      where: { invoiceId },
    });

    if (paymentCount > 0) {
      throw new BusinessRuleError(
        'Cannot delete invoice with existing payments. Cancel the invoice instead.'
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete invoice lines first (cascade should handle this, but being explicit)
      await tx.invoiceLine.deleteMany({
        where: { invoiceId },
      });

      // Delete the invoice
      await tx.invoice.delete({
        where: { id: invoiceId },
      });

      // Log the deletion
      await this.auditService.log(
        {
          userId: actorUserId,
          entityType: 'INVOICE',
          entityId: invoiceId,
          action: 'DELETED',
          oldValue: {
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            total: invoice.total,
          },
        },
        tx
      );

      return { success: true };
    });
  }

  /**
   * Internal method to transition invoice status
   */
  private async transition(invoiceId: string, toStatus: InvoiceStatus, actorUserId: string) {
    const invoice = await this.getById(invoiceId);

    if (!canTransitionInvoice(invoice.status as InvoiceStatus, toStatus)) {
      throw new InvalidTransitionError('Invoice', invoice.status, toStatus);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: toStatus },
        include: {
          lines: true,
          subscription: true,
        },
      });

      await this.auditService.logStatusChange(
        actorUserId,
        'INVOICE',
        invoiceId,
        invoice.status,
        toStatus,
        tx
      );

      return updated;
    });
  }
}
