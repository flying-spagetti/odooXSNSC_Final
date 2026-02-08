/**
 * Main Application Entry Point
 * Fastify server bootstrap with all plugins and routes
 */

// Load environment variables from .env file
import 'dotenv/config';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { logger } from './utils/logger';

// Plugins
import prismaPlugin from './plugins/prisma';
import authPlugin from './plugins/auth';
import errorHandlerPlugin from './plugins/error-handler';

// Routes
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import productsRoutes from './routes/products.routes';
import plansRoutes from './routes/plans.routes';
import subscriptionsRoutes from './routes/subscriptions.routes';
import invoicesRoutes from './routes/invoices.routes';
import taxesRoutes from './routes/taxes.routes';
import discountsRoutes from './routes/discounts.routes';
import reportsRoutes from './routes/reports.routes';

async function buildServer() {
  const fastify = Fastify({
    logger: logger,
    disableRequestLogging: false,
    requestIdLogLabel: 'requestId',
  });

  // Register CORS
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Register plugins
  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);
  await fastify.register(errorHandlerPlugin);

  // Health check
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // API v1 routes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(usersRoutes, { prefix: '/api/v1/admin/users' });
  await fastify.register(productsRoutes, { prefix: '/api/v1/products' });
  await fastify.register(plansRoutes, { prefix: '/api/v1/plans' });
  await fastify.register(subscriptionsRoutes, { prefix: '/api/v1/subscriptions' });
  await fastify.register(invoicesRoutes, { prefix: '/api/v1/invoices' });
  await fastify.register(taxesRoutes, { prefix: '/api/v1/taxes' });
  await fastify.register(discountsRoutes, { prefix: '/api/v1/discounts' });
  await fastify.register(reportsRoutes, { prefix: '/api/v1/reports' });

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();

    await server.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(
      `🚀 Server running on http://${config.server.host}:${config.server.port}`
    );
    logger.info(`📚 Environment: ${config.server.env}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

// Start server
if (require.main === module) {
  start();
}

export { buildServer };
