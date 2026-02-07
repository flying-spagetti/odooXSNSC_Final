/**
 * Discounts Routes
 * Discount management
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { DiscountService } from '../services/discount.service';

const CreateDiscountSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  description: z.string().optional(),
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
        })
        .parse(request.query);

      const discounts = await discountService.list({ isActive: query.isActive });
      return { discounts };
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
};

export default discountsRoutes;
