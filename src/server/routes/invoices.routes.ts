/**
 * Invoices Routes
 * Invoice management and payment recording
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { InvoiceService } from '../services/invoice.service';
import { PaymentService } from '../services/payment.service';
import { canAccessResource } from '../domain/permissions';
import { ForbiddenError } from '../domain/errors';
import { PaymentMethod } from '@prisma/client';

const RecordPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'CHECK', 'OTHER']),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().datetime().optional(),
});

const invoicesRoutes: FastifyPluginAsync = async (fastify) => {
  const invoiceService = new InvoiceService(fastify.prisma);
  const paymentService = new PaymentService(fastify.prisma);

  // List invoices
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('invoices:read')],
    },
    async (request, reply) => {
      const query = z
        .object({
          subscriptionId: z.string().optional(),
          status: z.enum(['DRAFT', 'CONFIRMED', 'PAID', 'CANCELED']).optional(),
          limit: z.coerce.number().min(1).max(100).default(20),
          offset: z.coerce.number().min(0).default(0),
        })
        .parse(request.query);

      const result = await invoiceService.list({
        subscriptionId: query.subscriptionId,
        userId: request.user!.role === 'PORTAL' ? request.user!.userId : undefined,
        status: query.status as any,
        limit: query.limit,
        offset: query.offset,
      });

      return result;
    }
  );

  // Get invoice by ID
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('invoices:read')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const invoice = await invoiceService.getById(params.id);

      // Check access
      if (
        !canAccessResource(
          request.user!.role,
          invoice.subscription.userId,
          request.user!.userId
        )
      ) {
        throw new ForbiddenError('invoices:read', 'Cannot access other users invoices');
      }

      return { invoice };
    }
  );

  // Action: Confirm
  fastify.post(
    '/:id/actions/confirm',
    {
      onRequest: [fastify.authenticate, fastify.authorize('invoices:actions')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const invoice = await invoiceService.actionConfirm(params.id, request.user!.userId);
      return { invoice };
    }
  );

  // Action: Cancel
  fastify.post(
    '/:id/actions/cancel',
    {
      onRequest: [fastify.authenticate, fastify.authorize('invoices:actions')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const invoice = await invoiceService.actionCancel(params.id, request.user!.userId);
      return { invoice };
    }
  );

  // Action: Restore (CANCELED -> DRAFT)
  fastify.post(
    '/:id/actions/restore',
    {
      onRequest: [fastify.authenticate, fastify.authorize('invoices:actions')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const invoice = await invoiceService.actionRestore(params.id, request.user!.userId);
      return { invoice };
    }
  );

  // Record payment
  fastify.post(
    '/:id/payments',
    {
      onRequest: [fastify.authenticate, fastify.authorize('payments:create')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const data = RecordPaymentSchema.parse(request.body);

      const invoice = await invoiceService.getById(params.id);

      if (
        !canAccessResource(
          request.user!.role,
          invoice.subscription.userId,
          request.user!.userId
        )
      ) {
        throw new ForbiddenError('payments:create', 'Cannot record payment for other users invoices');
      }

      const payment = await paymentService.recordPayment(
        params.id,
        {
          ...data,
          paymentMethod: data.paymentMethod as PaymentMethod,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
        },
        request.user!.userId
      );

      return { payment };
    }
  );

  // List payments for an invoice
  fastify.get(
    '/:id/payments',
    {
      onRequest: [fastify.authenticate, fastify.authorize('payments:read')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);

      const invoice = await invoiceService.getById(params.id);

      if (
        !canAccessResource(
          request.user!.role,
          invoice.subscription.userId,
          request.user!.userId
        )
      ) {
        throw new ForbiddenError('payments:read', 'Cannot access other users payments');
      }

      const payments = await paymentService.listByInvoice(params.id);
      return { payments };
    }
  );

  // Delete invoice
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('invoices:delete')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const result = await invoiceService.delete(params.id, request.user!.userId);
      return result;
    }
  );
};

export default invoicesRoutes;
