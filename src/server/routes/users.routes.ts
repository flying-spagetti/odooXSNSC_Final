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
};

export default usersRoutes;
