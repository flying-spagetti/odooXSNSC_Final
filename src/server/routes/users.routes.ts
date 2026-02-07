/**
 * Users Routes
 * Admin management of users
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { UserService } from '../services/user.service';
import { Role } from '@prisma/client';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'INTERNAL', 'PORTAL']),
});

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const userService = new UserService(fastify.prisma);

  // Create user (ADMIN only, can create INTERNAL users)
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('users:create')],
    },
    async (request, reply) => {
      const data = CreateUserSchema.parse(request.body);
      const user = await userService.create(data);
      return { user };
    }
  );

  // List users
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('users:read')],
    },
    async (request, reply) => {
      const query = z
        .object({
          role: z.enum(['ADMIN', 'INTERNAL', 'PORTAL']).optional(),
          limit: z.coerce.number().min(1).max(100).default(20),
          offset: z.coerce.number().min(0).default(0),
        })
        .parse(request.query);

      const result = await userService.list({
        role: query.role as Role | undefined,
        limit: query.limit,
        offset: query.offset,
      });

      return result;
    }
  );

  // Get user by ID
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('users:read')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const user = await userService.getById(params.id);
      return { user };
    }
  );

  // Update user profile (for portal users to update their own profile)
  fastify.patch(
    '/:id/profile',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const body = z
        .object({
          name: z.string().min(2).optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
        })
        .parse(request.body);

      // Portal users can only update their own profile
      if (request.user!.role === 'PORTAL' && params.id !== request.user!.userId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      const user = await userService.updateProfile(params.id, body);
      return { user };
    }
  );
};

export default usersRoutes;
