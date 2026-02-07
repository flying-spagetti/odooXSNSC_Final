/**
 * Prisma Plugin
 * Provides Prisma client instance to all routes
 */

import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Connect to database
  await prisma.$connect();

  // Decorate Fastify instance
  fastify.decorate('prisma', prisma);

  // Close connection when server closes
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });

  fastify.log.info('Prisma connected to database');
};

export default fp(prismaPlugin, {
  name: 'prisma',
});
