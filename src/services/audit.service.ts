/**
 * Audit Service
 * Centralized audit logging for all domain actions
 */

import { PrismaClient } from '@prisma/client';

export type EntityType =
  | 'USER'
  | 'PRODUCT'
  | 'PRODUCT_VARIANT'
  | 'RECURRING_PLAN'
  | 'SUBSCRIPTION'
  | 'SUBSCRIPTION_LINE'
  | 'INVOICE'
  | 'INVOICE_LINE'
  | 'PAYMENT'
  | 'DISCOUNT'
  | 'TAX_RATE';

export type AuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'STATUS_CHANGE'
  | 'PAYMENT_RECORDED'
  | 'LINE_ADDED'
  | 'LINE_REMOVED';

export interface AuditLogData {
  userId: string;
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create an audit log entry
   * Can be called within or outside a transaction
   */
  async log(data: AuditLogData, tx?: PrismaClient): Promise<void> {
    const client = tx || this.prisma;

    await client.auditLog.create({
      data: {
        userId: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
        newValue: data.newValue ? JSON.stringify(data.newValue) : null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  }

  /**
   * Log status change with old and new status
   */
  async logStatusChange(
    userId: string,
    entityType: EntityType,
    entityId: string,
    oldStatus: string,
    newStatus: string,
    tx?: PrismaClient
  ): Promise<void> {
    await this.log(
      {
        userId,
        entityType,
        entityId,
        action: 'STATUS_CHANGE',
        oldValue: { status: oldStatus },
        newValue: { status: newStatus },
      },
      tx
    );
  }

  /**
   * Query audit logs for an entity
   */
  async getEntityLogs(entityType: EntityType, entityId: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }
}
