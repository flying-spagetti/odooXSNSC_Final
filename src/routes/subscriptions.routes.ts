/**
 * Subscriptions Routes
 * Subscription lifecycle management
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { SubscriptionService } from '../services/subscription.service';
import { InvoiceService } from '../services/invoice.service';
import { canAccessResource } from '../domain/permissions';
import { ForbiddenError } from '../domain/errors';

const CreateSubscriptionSchema = z.object({
  userId: z.string(),
  planId: z.string(),
  notes: z.string().optional(),
});

const AddLineSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discountId: z.string().optional(),
  taxRateId: z.string().optional(),
  notes: z.string().optional(),
});

const subscriptionsRoutes: FastifyPluginAsync = async (fastify) => {
  const subscriptionService = new SubscriptionService(fastify.prisma);
  const invoiceService = new InvoiceService(fastify.prisma);

  // Create subscription
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('subscriptions:create')],
    },
    async (request, reply) => {
      const data = CreateSubscriptionSchema.parse(request.body);
      const subscription = await subscriptionService.create(data, request.user!.userId);
      return { subscription };
    }
  );

  // List subscriptions
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('subscriptions:read')],
    },
    async (request, reply) => {
      const query = z
        .object({
          userId: z.string().optional(),
          status: z.enum(['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED']).optional(),
          limit: z.coerce.number().min(1).max(100).default(20),
          offset: z.coerce.number().min(0).default(0),
        })
        .parse(request.query);

      // PORTAL users can only see their own subscriptions
      let userId = query.userId;
      if (request.user!.role === 'PORTAL') {
        userId = request.user!.userId;
      }

      const result = await subscriptionService.list({
        userId,
        status: query.status as any,
        limit: query.limit,
        offset: query.offset,
      });

      return result;
    }
  );

  // Get subscription by ID
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('subscriptions:read')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const subscription = await subscriptionService.getById(params.id, {
        plan: true,
        user: { select: { id: true, email: true, name: true } },
        lines: {
          include: {
            variant: { include: { product: true } },
            discount: true,
            taxRate: true,
          },
        },
      });

      // Check access
      if (!canAccessResource(request.user!.role, subscription.userId, request.user!.userId)) {
        throw new ForbiddenError('subscriptions:read', 'Cannot access other users subscriptions');
      }

      return { subscription };
    }
  );

  // Add line to subscription
  fastify.post(
    '/:id/lines',
    {
      onRequest: [fastify.authenticate, fastify.authorize('subscriptions:update')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const data = AddLineSchema.parse(request.body);

      const line = await subscriptionService.addLine(params.id, data, request.user!.userId);
      return { line };
    }
  );

  // Action: Quote
  fastify.post(
    '/:id/actions/quote',
    {
      onRequest: [fastify.authenticate, fastify.authorize('subscriptions:actions')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const subscription = await subscriptionService.actionQuote(params.id, request.user!.userId);
      return { subscription };
    }
  );

  // Action: Confirm
  fastify.post(
    '/:id/actions/confirm',
    {
      onRequest: [fastify.authenticate, fastify.authorize('subscriptions:actions')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const body = z
        .object({
          startDate: z.string().datetime().optional(),
        })
        .parse(request.body);

      const subscription = await subscriptionService.actionConfirm(
        params.id,
        request.user!.userId,
        body.startDate ? new Date(body.startDate) : undefined
      );
      return { subscription };
    }
  );

  // Action: Activate
  fastify.post(
    '/:id/actions/activate',
    {
      onRequest: [fastify.authenticate, fastify.authorize('subscriptions:actions')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const subscription = await subscriptionService.actionActivate(
        params.id,
        request.user!.userId
      );
      return { subscription };
    }
  );

  // Action: Close
  fastify.post(
    '/:id/actions/close',
    {
      onRequest: [fastify.authenticate, fastify.authorize('subscriptions:actions')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const body = z
        .object({
          endDate: z.string().datetime().optional(),
        })
        .parse(request.body);

      const subscription = await subscriptionService.actionClose(
        params.id,
        request.user!.userId,
        body.endDate ? new Date(body.endDate) : undefined
      );
      return { subscription };
    }
  );

  // Generate invoice for period
  fastify.post(
    '/:id/invoices/generate',
    {
      onRequest: [fastify.authenticate, fastify.authorize('invoices:create')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const query = z
        .object({
          periodStart: z.string().datetime(),
        })
        .parse(request.query);

      const invoice = await invoiceService.generateInvoiceForPeriod(
        params.id,
        new Date(query.periodStart),
        request.user!.userId
      );

      return { invoice };
    }
  );
};

export default subscriptionsRoutes;
