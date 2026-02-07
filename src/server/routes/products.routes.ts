/**
 * Products Routes
 * Product and variant management
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ProductService } from '../services/product.service';

const CreateProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

const CreateVariantSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  basePrice: z.number().positive(),
  description: z.string().optional(),
});

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  const productService = new ProductService(fastify.prisma);

  // Create product
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('products:create')],
    },
    async (request, reply) => {
      const data = CreateProductSchema.parse(request.body);
      const product = await productService.createProduct(data);
      return { product };
    }
  );

  // List products
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('products:read')],
    },
    async (request, reply) => {
      const query = z
        .object({
          isActive: z.coerce.boolean().optional(),
          limit: z.coerce.number().min(1).max(100).default(20),
          offset: z.coerce.number().min(0).default(0),
        })
        .parse(request.query);

      const result = await productService.listProducts(query);
      return result;
    }
  );

  // Get product by ID
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('products:read')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const product = await productService.getProduct(params.id);
      return { product };
    }
  );

  // Update product
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('products:update')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const data = CreateProductSchema.partial().parse(request.body);
      const product = await productService.updateProduct(params.id, data);
      return { product };
    }
  );

  // Create variant
  fastify.post(
    '/:id/variants',
    {
      onRequest: [fastify.authenticate, fastify.authorize('products:create')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const data = CreateVariantSchema.parse(request.body);
      const variant = await productService.createVariant({
        ...data,
        productId: params.id,
      });
      return { variant };
    }
  );

  // List variants for a product
  fastify.get(
    '/:id/variants',
    {
      onRequest: [fastify.authenticate, fastify.authorize('products:read')],
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const variants = await productService.listVariantsByProduct(params.id);
      return { variants };
    }
  );
};

export default productsRoutes;
