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

    // Active subscriptions
    const activeSubscriptionsCount = await this.prisma.subscription.count({
      where: {
        status: 'ACTIVE',
      },
    });

    // Total revenue (sum of all PAID invoices)
    const revenueResult = await this.prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      _sum: {
        total: true,
      },
    });

    // Total payments
    const paymentsResult = await this.prisma.payment.aggregate({
      where: {
        ...(from || to
          ? {
              paymentDate: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      _sum: {
        amount: true,
      },
    });

    // Overdue invoices
    const now = new Date();
    const overdueInvoicesCount = await this.prisma.invoice.count({
      where: {
        status: { in: ['CONFIRMED'] },
        dueDate: { lt: now },
      },
    });

    // Invoice counts by status
    const [draftInvoicesCount, confirmedInvoicesCount, paidInvoicesCount] = await Promise.all([
      this.prisma.invoice.count({ where: { status: 'DRAFT' } }),
      this.prisma.invoice.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.invoice.count({ where: { status: 'PAID' } }),
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
        createdAt: {
          gte: filters.from,
          lte: filters.to,
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return invoices;
  }
}
