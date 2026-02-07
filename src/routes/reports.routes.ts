/**
 * Reports Routes
 * Analytics and reporting endpoints
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ReportService } from '../services/report.service';

const reportsRoutes: FastifyPluginAsync = async (fastify) => {
  const reportService = new ReportService(fastify.prisma);

  // Get summary report
  fastify.get(
    '/summary',
    {
      onRequest: [fastify.authenticate, fastify.authorize('reports:read')],
    },
    async (request, reply) => {
      const query = z
        .object({
          from: z.string().datetime().optional(),
          to: z.string().datetime().optional(),
        })
        .parse(request.query);

      const summary = await reportService.getSummary({
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
      });

      return { summary };
    }
  );

  // Get subscription metrics
  fastify.get(
    '/subscriptions/metrics',
    {
      onRequest: [fastify.authenticate, fastify.authorize('reports:read')],
    },
    async (request, reply) => {
      const metrics = await reportService.getSubscriptionMetrics();
      return { metrics };
    }
  );
};

export default reportsRoutes;
