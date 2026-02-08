/**
 * Reports Routes
 * Analytics and reporting endpoints
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ReportService } from '../services/report.service';
import { AIService } from '../services/ai.service';

const reportsRoutes: FastifyPluginAsync = async (fastify) => {
  const reportService = new ReportService(fastify.prisma);
  const aiService = new AIService();

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

  // Get AI-powered report summary
  fastify.post(
    '/ai-summary',
    {
      onRequest: [fastify.authenticate, fastify.authorize('reports:read')],
    },
    async (request, reply) => {
      const body = z
        .object({
          from: z.string().optional(),
          to: z.string().optional(),
        })
        .parse(request.body);

      // Fetch report data
      const summary = await reportService.getSummary({
        from: body.from ? new Date(body.from) : undefined,
        to: body.to ? new Date(body.to) : undefined,
      });

      const metrics = await reportService.getSubscriptionMetrics();

      // Generate AI summary
      const aiSummary = await aiService.summarizeReport({
        summary,
        metrics,
        dateRange: {
          from: body.from,
          to: body.to,
        },
      });

      return { summary: aiSummary };
    }
  );
};

export default reportsRoutes;
