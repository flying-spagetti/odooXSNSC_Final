/**
 * Discounts Routes
 * Discount management
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { DiscountService } from '../services/discount.service';

const CreateDiscountSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional().transform((str) => (str ? new Date(str) : undefined)),
  endDate: z.string().datetime().optional().transform((str) => (str ? new Date(str) : undefined)),
  maxUses: z.number().int().positive().optional(),
  maxUsesPerUser: z.number().int().positive().optional(),
  minPurchaseAmount: z.number().positive().optional(),
  applicableProductIds: z.array(z.string()).optional(),
});

const ValidateDiscountSchema = z.object({
  code: z.string().min(1),
  cartItems: z.array(
    z.object({
      variantId: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ),
  userId: z.string().optional(),
});

const discountsRoutes: FastifyPluginAsync = async (fastify) => {
  const discountService = new DiscountService(fastify.prisma);

  // Create discount
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('discounts:create')],
    },
    async (request, reply) => {
      const data = CreateDiscountSchema.parse(request.body);
      const discount = await discountService.create(data);
      return { discount };
    }
  );

  // List discounts
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('discounts:read')],
    },
    async (request, reply) => {
      const query = z
        .object({
          isActive: z.coerce.boolean().optional(),
          limit: z.coerce.number().min(1).max(100).default(100),
          offset: z.coerce.number().min(0).default(0),
        })
        .parse(request.query);

      const result = await discountService.list({ isActive: query.isActive, limit: query.limit, offset: query.offset });
      return result;
    }
  );

  // Get discount by ID
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('discounts:read')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const discount = await discountService.getById(params.id);
      return { discount };
    }
  );

  // Update discount
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('discounts:update')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const data = CreateDiscountSchema.partial().parse(request.body);
      const discount = await discountService.update(params.id, data);
      return { discount };
    }
  );

  // Deactivate discount
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('discounts:delete')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const discount = await discountService.deactivate(params.id);
      return { discount };
    }
  );

  // Validate discount code (accessible to PORTAL users)
  fastify.post(
    '/validate',
    {
      onRequest: [fastify.authenticate, fastify.authorize('discounts:read')],
    },
    async (request, reply) => {
      const data = ValidateDiscountSchema.parse(request.body);
      const userId = request.user?.userId;
      
      const result = await discountService.validateDiscountCode({
        ...data,
        userId,
      });
      
      return result;
    }
  );
};

export default discountsRoutes;
