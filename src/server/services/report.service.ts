/**
 * Report Service
 * Provides aggregated reports and analytics
 */

import { PrismaClient } from '@prisma/client';

export interface ReportSummary {
  activeSubscriptionsCount: number;
  totalRevenue: number;
  totalPayments: number;
  overdueInvoicesCount: number;
  draftInvoicesCount: number;
  confirmedInvoicesCount: number;
  paidInvoicesCount: number;
}

export class ReportService {
  constructor(private prisma: PrismaClient) {}

  async getSummary(filters: { from?: Date; to?: Date }): Promise<ReportSummary> {
    const { from, to } = filters;

    // Active subscriptions (not filtered by date - current state)
    const activeSubscriptionsCount = await this.prisma.subscription.count({
      where: {
        status: 'ACTIVE',
      },
    });

    // Build date filter for invoices (use issueDate for revenue reporting)
    const invoiceDateFilter = from || to
      ? {
          issueDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {};

    // Total revenue (sum of all PAID invoices)
    const revenueResult = await this.prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        ...invoiceDateFilter,
      },
      _sum: {
        total: true,
      },
    });

    // Build date filter for payments
    const paymentDateFilter = from || to
      ? {
          paymentDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {};

    // Total payments
    const paymentsResult = await this.prisma.payment.aggregate({
      where: {
        ...paymentDateFilter,
      },
      _sum: {
        amount: true,
      },
    });

    // Overdue invoices (not filtered by date - current state)
    const now = new Date();
    const overdueInvoicesCount = await this.prisma.invoice.count({
      where: {
        status: { in: ['CONFIRMED'] },
        dueDate: { lt: now },
      },
    });

    // Invoice counts by status (filtered by date if provided)
    const invoiceStatusWhere = from || to ? invoiceDateFilter : {};
    const [draftInvoicesCount, confirmedInvoicesCount, paidInvoicesCount] = await Promise.all([
      this.prisma.invoice.count({ where: { status: 'DRAFT', ...invoiceStatusWhere } }),
      this.prisma.invoice.count({ where: { status: 'CONFIRMED', ...invoiceStatusWhere } }),
      this.prisma.invoice.count({ where: { status: 'PAID', ...invoiceStatusWhere } }),
    ]);

    return {
      activeSubscriptionsCount,
      totalRevenue: parseFloat(revenueResult._sum.total?.toString() || '0'),
      totalPayments: parseFloat(paymentsResult._sum.amount?.toString() || '0'),
      overdueInvoicesCount,
      draftInvoicesCount,
      confirmedInvoicesCount,
      paidInvoicesCount,
    };
  }

  async getSubscriptionMetrics() {
    const statusCounts = await this.prisma.subscription.groupBy({
      by: ['status'],
      _count: true,
    });

    return statusCounts.map((item) => ({
      status: item.status,
      count: item._count,
    }));
  }

  async getRevenueByPeriod(filters: { from: Date; to: Date; groupBy: 'day' | 'month' }) {
    // This would require more complex SQL queries
    // For simplicity, returning invoices grouped by date
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: 'PAID',
        issueDate: {
          gte: filters.from,
          lte: filters.to,
        },
      },
      select: {
        issueDate: true,
        total: true,
      },
      orderBy: { issueDate: 'asc' },
    });

    return invoices;
  }
}
