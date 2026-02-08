/**
 * Contacts Routes
 * Management of contact records
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ContactService } from '../services/contact.service';

const CreateContactSchema = z.object({
  userId: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const UpdateContactSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const contactsRoutes: FastifyPluginAsync = async (fastify) => {
  const contactService = new ContactService(fastify.prisma);

  // Create contact
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('contacts:create')],
    },
    async (request, reply) => {
      const data = CreateContactSchema.parse(request.body);
      const contact = await contactService.create(data);
      return { contact };
    }
  );

  // List contacts
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('contacts:read')],
    },
    async (request, reply) => {
      try {
        const query = z
          .object({
            userId: z.string().optional(),
            limit: z.coerce.number().min(1).max(100).default(20),
            offset: z.coerce.number().min(0).default(0),
          })
          .parse(request.query);

        // PORTAL users can only see their own contacts
        let userId = query.userId;
        if (request.user!.role === 'PORTAL') {
          userId = request.user!.userId;
        }

        const result = await contactService.list({
          userId,
          limit: query.limit,
          offset: query.offset,
        });

        return result;
      } catch (error: any) {
        throw error;
      }
    }
  );

  // Get contact by ID
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('contacts:read')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const contact = await contactService.getById(params.id);

      // PORTAL users can only see their own contacts
      if (request.user!.role === 'PORTAL' && contact.userId !== request.user!.userId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      return { contact };
    }
  );

  // Update contact
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('contacts:update')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const body = UpdateContactSchema.parse(request.body);

      const contact = await contactService.getById(params.id);

      // PORTAL users can only update their own contacts
      if (request.user!.role === 'PORTAL' && contact.userId !== request.user!.userId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      const updated = await contactService.update(params.id, body);
      return { contact: updated };
    }
  );

  // Delete contact
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('contacts:delete')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);

      const contact = await contactService.getById(params.id);

      // PORTAL users can only delete their own contacts
      if (request.user!.role === 'PORTAL' && contact.userId !== request.user!.userId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      await contactService.delete(params.id);
      return { success: true };
    }
  );

  // Get active subscriptions count for a contact
  fastify.get(
    '/:id/subscriptions/count',
    {
      onRequest: [fastify.authenticate, fastify.authorize('contacts:read')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const contact = await contactService.getById(params.id);

      // PORTAL users can only see their own contacts
      if (request.user!.role === 'PORTAL' && contact.userId !== request.user!.userId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      const count = await contactService.getActiveSubscriptionsCount(params.id);
      return { count };
    }
  );
};

export default contactsRoutes;
