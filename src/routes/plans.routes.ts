/**
 * Plans Routes
 * Recurring plan management
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { PlanService } from '../services/plan.service';
import { BillingPeriod } from '@prisma/client';

const CreatePlanSchema = z.object({
  name: z.string().min(2),
  billingPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  intervalCount: z.number().int().positive().default(1),
  description: z.string().optional(),
});

const plansRoutes: FastifyPluginAsync = async (fastify) => {
  const planService = new PlanService(fastify.prisma);

  // Create plan
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('plans:create')],
    },
    async (request, reply) => {
      const data = CreatePlanSchema.parse(request.body);
      const plan = await planService.create({
        ...data,
        billingPeriod: data.billingPeriod as BillingPeriod,
      });
      return { plan };
    }
  );

  // List plans
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('plans:read')],
    },
    async (request, reply) => {
      const query = z
        .object({
          isActive: z.coerce.boolean().optional(),
          limit: z.coerce.number().min(1).max(100).default(20),
          offset: z.coerce.number().min(0).default(0),
        })
        .parse(request.query);

      const result = await planService.list(query);
      return result;
    }
  );

  // Get plan by ID
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('plans:read')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const plan = await planService.getById(params.id);
      return { plan };
    }
  );

  // Update plan
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('plans:update')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const data = CreatePlanSchema.partial().parse(request.body);
      const plan = await planService.update(params.id, data);
      return { plan };
    }
  );
};

export default plansRoutes;
