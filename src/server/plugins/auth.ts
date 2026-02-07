/**
 * Auth Plugin
 * JWT authentication and authorization middleware
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { UnauthorizedError, ForbiddenError } from '../domain/errors';
import { Role, Permission, hasPermission } from '../domain/permissions';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Register JWT plugin
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  });

  // Authentication decorator
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = await request.jwtVerify<JWTPayload>();
      request.user = payload;
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  });

  // Authorization decorator - check if user has required permission
  fastify.decorate(
    'authorize',
    (permission: Permission) => async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!hasPermission(request.user.role, permission)) {
        throw new ForbiddenError(permission, `Role ${request.user.role} lacks this permission`);
      }
    }
  );

  fastify.log.info('Auth plugin registered');
};

export default fp(authPlugin, {
  name: 'auth',
});
