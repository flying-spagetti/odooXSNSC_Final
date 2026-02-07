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

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

const VerifyTokenSchema = z.object({
  token: z.string(),
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

  // Request password reset
  fastify.post('/forgot-password', async (request, reply) => {
    const data = ForgotPasswordSchema.parse(request.body);
    const result = await userService.requestPasswordReset(data.email);
    return result;
  });

  // Verify reset token
  fastify.post('/verify-reset-token', async (request, reply) => {
    const data = VerifyTokenSchema.parse(request.body);
    const user = await userService.verifyResetToken(data.token);
    return { 
      valid: true,
      email: user.email,
      name: user.name,
    };
  });

  // Reset password with token
  fastify.post('/reset-password', async (request, reply) => {
    const data = ResetPasswordSchema.parse(request.body);
    const result = await userService.resetPassword(data.token, data.password);
    return result;
  });

  // Check if email exists (for validation)
  fastify.post('/check-email', async (request, reply) => {
    const data = ForgotPasswordSchema.parse(request.body);
    const exists = await userService.checkEmailExists(data.email);
    return { exists };
  });
};

export default authRoutes;
