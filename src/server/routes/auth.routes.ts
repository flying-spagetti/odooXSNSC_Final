/**
 * Auth Routes
 * User signup and login endpoints
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { UserService } from '../services/user.service';

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const userService = new UserService(fastify.prisma);

  // Signup (creates PORTAL user by default)
  fastify.post('/signup', async (request, reply) => {
    const data = SignupSchema.parse(request.body);

    const user = await userService.create({
      ...data,
      role: 'PORTAL',
    });

    const token = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      token,
    };
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const data = LoginSchema.parse(request.body);

    const user = await userService.authenticate(data);

    const token = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      token,
    };
  });

  // Get current user profile
  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const user = await userService.getById(request.user!.userId);
      return { user };
    }
  );
};

export default authRoutes;
