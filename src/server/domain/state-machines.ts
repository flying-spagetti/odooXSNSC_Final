/**
 * State Machine Definitions
 * Explicit state transition rules for domain entities
 */

export type SubscriptionStatus = 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'CLOSED';
export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELED';

/**
 * Subscription State Machine
 * DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED
 */
export const SubscriptionTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  DRAFT: ['QUOTATION'],
  QUOTATION: ['CONFIRMED', 'DRAFT'],
  CONFIRMED: ['ACTIVE', 'CLOSED'],
  ACTIVE: ['CLOSED'],
  CLOSED: [], // Terminal state
};

/**
 * Invoice State Machine
 * DRAFT -> CONFIRMED -> PAID
 *       \-> CANCELED
 */
export const InvoiceTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELED'],
  CONFIRMED: ['PAID', 'CANCELED'],
  PAID: [], // Terminal state
  CANCELED: [], // Terminal state
};

export function canTransitionSubscription(
  from: SubscriptionStatus,
  to: SubscriptionStatus
): boolean {
  return SubscriptionTransitions[from]?.includes(to) ?? false;
}

export function canTransitionInvoice(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return InvoiceTransitions[from]?.includes(to) ?? false;
}

/**
 * Action to Status mapping
 */
export const SubscriptionActions = {
  QUOTE: { from: ['DRAFT'], to: 'QUOTATION' as SubscriptionStatus },
  CONFIRM: { from: ['QUOTATION'], to: 'CONFIRMED' as SubscriptionStatus },
  ACTIVATE: { from: ['CONFIRMED'], to: 'ACTIVE' as SubscriptionStatus },
  CLOSE: { from: ['CONFIRMED', 'ACTIVE'], to: 'CLOSED' as SubscriptionStatus },
} as const;

export const InvoiceActions = {
  CONFIRM: { from: ['DRAFT'], to: 'CONFIRMED' as InvoiceStatus },
  CANCEL: { from: ['DRAFT', 'CONFIRMED'], to: 'CANCELED' as InvoiceStatus },
  MARK_PAID: { from: ['CONFIRMED'], to: 'PAID' as InvoiceStatus },
} as const;
