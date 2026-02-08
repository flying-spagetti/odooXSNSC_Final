/**
 * Payment Service
 * Manages payment recording and invoice payment status
 */

import { PrismaClient, Payment, PaymentMethod } from '@prisma/client';
import { NotFoundError, BusinessRuleError } from '../domain/errors';
import { AuditService } from './audit.service';
import { InvoiceService } from './invoice.service';
import { isFullyPaid } from '../domain/pricing';

export interface RecordPaymentData {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  paymentDate?: Date;
}

export class PaymentService {
  private auditService: AuditService;
  private invoiceService: InvoiceService;

  constructor(private prisma: PrismaClient) {
    this.auditService = new AuditService(prisma);
    this.invoiceService = new InvoiceService(prisma);
  }

  /**
   * Record a payment for an invoice
   * If fully paid, mark invoice as PAID
   * TRANSACTIONAL: Creates payment + updates invoice + audit in single transaction
   */
  async recordPayment(
    invoiceId: string,
    data: RecordPaymentData,
    actorUserId: string
  ): Promise<Payment> {
    // Validate payment amount before opening a transaction
    if (data.amount <= 0) {
      throw new BusinessRuleError('Payment amount must be greater than zero');
    }

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new NotFoundError('Invoice', invoiceId);
      }

      // Validate invoice is in correct status
      if (!['CONFIRMED', 'PAID'].includes(invoice.status)) {
        throw new BusinessRuleError('Payments can only be recorded for CONFIRMED or PAID invoices');
      }

      const currentPaidAmount = parseFloat(invoice.paidAmount.toString());
      const totalAmount = parseFloat(invoice.total.toString());
      const newPaidAmount = currentPaidAmount + data.amount;

      // Check for overpayment using latest invoice values inside transaction
      if (newPaidAmount > totalAmount) {
        throw new BusinessRuleError(
          `Payment amount would exceed invoice total. Outstanding: ${totalAmount - currentPaidAmount}`
        );
      }

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          notes: data.notes,
          paymentDate: data.paymentDate || new Date(),
        },
      });

      // Update invoice paid amount
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
        },
      });

      // If fully paid and still in CONFIRMED status, mark as PAID
      if (isFullyPaid(updatedInvoice.total, updatedInvoice.paidAmount)) {
        if (updatedInvoice.status === 'CONFIRMED') {
          await this.invoiceService.markPaid(invoiceId, actorUserId, tx);
        }
      }

      await this.auditService.log(
        {
          userId: actorUserId,
          entityType: 'INVOICE',
          entityId: invoiceId,
          action: 'PAYMENT_RECORDED',
          newValue: {
            paymentId: payment.id,
            amount: data.amount,
            method: data.paymentMethod,
            paidAmount: newPaidAmount,
          },
        },
        tx
      );

      return payment;
    });
  }

  /**
   * Get payment by ID
   */
  async getById(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment', paymentId);
    }

    return payment;
  }

  /**
   * List payments for an invoice
   */
  async listByInvoice(invoiceId: string) {
    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  /**
   * List all payments with pagination
   */
  async list(filters: { limit?: number; offset?: number }) {
    const { limit = 20, offset = 0 } = filters;

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        include: {
          invoice: {
            include: {
              subscription: {
                select: {
                  subscriptionNumber: true,
                  user: { select: { id: true, email: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.payment.count(),
    ]);

    return { items, total, limit, offset };
  }
}
