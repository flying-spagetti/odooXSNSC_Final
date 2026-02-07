/**
 * Pricing Calculation Helpers
 * Deterministic pricing logic for subscriptions and invoices
 */

import { Decimal } from '@prisma/client/runtime/library';

export interface LineItem {
  quantity: number;
  unitPrice: number | Decimal;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number | Decimal;
  taxRate?: number | Decimal;
}

export interface LineCalculation {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface TotalCalculation {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

/**
 * Convert Decimal to number for calculations
 */
function toNumber(value: number | Decimal): number {
  if (typeof value === 'number') return value;
  return parseFloat(value.toString());
}

/**
 * Round to 2 decimal places
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate line item totals
 * Order: subtotal -> discount -> taxable amount -> tax -> line total
 */
export function calculateLineItem(item: LineItem): LineCalculation {
  const quantity = item.quantity;
  const unitPrice = toNumber(item.unitPrice);
  const subtotal = round(quantity * unitPrice);

  // Calculate discount
  let discountAmount = 0;
  if (item.discountType && item.discountValue) {
    const discountValue = toNumber(item.discountValue);
    if (item.discountType === 'PERCENTAGE') {
      discountAmount = round(subtotal * (discountValue / 100));
    } else if (item.discountType === 'FIXED') {
      discountAmount = round(discountValue);
    }
  }

  const taxableAmount = round(subtotal - discountAmount);

  // Calculate tax on taxable amount
  let taxAmount = 0;
  if (item.taxRate) {
    const taxRate = toNumber(item.taxRate);
    taxAmount = round(taxableAmount * (taxRate / 100));
  }

  const lineTotal = round(taxableAmount + taxAmount);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    lineTotal,
  };
}

/**
 * Calculate totals from multiple line items
 */
export function calculateTotals(lines: LineCalculation[]): TotalCalculation {
  const subtotal = round(lines.reduce((sum, line) => sum + line.subtotal, 0));
  const discountAmount = round(lines.reduce((sum, line) => sum + line.discountAmount, 0));
  const taxAmount = round(lines.reduce((sum, line) => sum + line.taxAmount, 0));
  const total = round(lines.reduce((sum, line) => sum + line.lineTotal, 0));

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
  };
}

/**
 * Check if an invoice is fully paid
 */
export function isFullyPaid(total: number | Decimal, paidAmount: number | Decimal): boolean {
  const totalNum = toNumber(total);
  const paidNum = toNumber(paidAmount);
  return paidNum >= totalNum;
}

/**
 * Calculate next billing date based on billing period
 */
export function calculateNextBillingDate(
  startDate: Date,
  billingPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  intervalCount: number = 1
): Date {
  const nextDate = new Date(startDate);

  switch (billingPeriod) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + intervalCount);
      break;
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + intervalCount * 7);
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + intervalCount);
      break;
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + intervalCount);
      break;
  }

  return nextDate;
}

/**
 * Calculate period end date based on period start and billing period
 */
export function calculatePeriodEnd(
  periodStart: Date,
  billingPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  intervalCount: number = 1
): Date {
  const periodEnd = calculateNextBillingDate(periodStart, billingPeriod, intervalCount);
  // Subtract 1 second to get the last moment of the period
  return new Date(periodEnd.getTime() - 1000);
}

/**
 * Calculate due date (typically 30 days from issue date)
 */
export function calculateDueDate(issueDate: Date, daysUntilDue: number = 30): Date {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + daysUntilDue);
  return dueDate;
}
