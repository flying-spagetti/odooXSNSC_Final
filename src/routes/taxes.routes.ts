/**
 * Taxes Routes
 * Tax rate management
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { TaxService } from '../services/tax.service';

const CreateTaxRateSchema = z.object({
  name: z.string().min(2),
  rate: z.number().min(0).max(100),
  description: z.string().optional(),
});

const taxesRoutes: FastifyPluginAsync = async (fastify) => {
  const taxService = new TaxService(fastify.prisma);

  // Create tax rate
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('taxes:create')],
    },
    async (request, reply) => {
      const data = CreateTaxRateSchema.parse(request.body);
      const taxRate = await taxService.create(data);
      return { taxRate };
    }
  );

  // List tax rates
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('taxes:read')],
    },
    async (request, reply) => {
      const query = z
        .object({
          isActive: z.coerce.boolean().optional(),
        })
        .parse(request.query);

      const taxRates = await taxService.list({ isActive: query.isActive });
      return { taxRates };
    }
  );

  // Get tax rate by ID
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('taxes:read')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const taxRate = await taxService.getById(params.id);
      return { taxRate };
    }
  );

  // Update tax rate
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('taxes:update')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const data = CreateTaxRateSchema.partial().parse(request.body);
      const taxRate = await taxService.update(params.id, data);
      return { taxRate };
    }
  );

  // Deactivate tax rate
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('taxes:delete')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const taxRate = await taxService.deactivate(params.id);
      return { taxRate };
    }
  );
};

export default taxesRoutes;
