/**
 * Templates Routes
 * Subscription template CRUD management
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { TemplateService } from '../services/template.service';

const CreateTemplateLineSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().positive(),
  discountId: z.string().optional(),
  taxRateId: z.string().optional(),
});

const CreateTemplateSchema = z.object({
  name: z.string().min(2),
  validityDays: z.number().int().positive().default(30),
  planId: z.string(),
  description: z.string().optional(),
  lines: z.array(CreateTemplateLineSchema).optional(),
});

const UpdateTemplateSchema = z.object({
  name: z.string().min(2).optional(),
  validityDays: z.number().int().positive().optional(),
  planId: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const templatesRoutes: FastifyPluginAsync = async (fastify) => {
  const templateService = new TemplateService(fastify.prisma);

  // Create template
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('templates:create')],
    },
    async (request, reply) => {
      const data = CreateTemplateSchema.parse(request.body);
      const template = await templateService.create(data);
      reply.status(201);
      return { template };
    }
  );

  // List templates
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('templates:read')],
    },
    async (request, reply) => {
      const query = z
        .object({
          isActive: z.coerce.boolean().optional(),
          limit: z.coerce.number().min(1).max(100).default(20),
          offset: z.coerce.number().min(0).default(0),
        })
        .parse(request.query);

      const result = await templateService.list(query);
      return result;
    }
  );

  // Get template by ID
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('templates:read')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const template = await templateService.getById(params.id);
      return { template };
    }
  );

  // Update template
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('templates:update')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const data = UpdateTemplateSchema.parse(request.body);
      const template = await templateService.update(params.id, data);
      return { template };
    }
  );

  // Delete template
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('templates:delete')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      await templateService.delete(params.id);
      reply.status(204).send();
    }
  );

  // Add a line to a template
  fastify.post(
    '/:id/lines',
    {
      onRequest: [fastify.authenticate, fastify.authorize('templates:update')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const data = CreateTemplateLineSchema.parse(request.body);
      const line = await templateService.addLine(params.id, data);
      reply.status(201);
      return { line };
    }
  );

  // Remove a line from a template
  fastify.delete(
    '/:id/lines/:lineId',
    {
      onRequest: [fastify.authenticate, fastify.authorize('templates:update')],
    },
    async (request, reply) => {
      const params = z
        .object({ id: z.string(), lineId: z.string() })
        .parse(request.params);
      await templateService.removeLine(params.id, params.lineId);
      reply.status(204).send();
    }
  );
};

export default templatesRoutes;
