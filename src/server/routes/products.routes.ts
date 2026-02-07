/**
 * Products Routes
 * Product and variant management
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ProductService } from '../services/product.service';
import { saveUploadedFile } from '../utils/fileUpload';

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
      const parts = request.parts();
      let name = '';
      let description = '';
      let imageUrl: string | undefined;

      for await (const part of parts) {
        if (part.type === 'file') {
          imageUrl = await saveUploadedFile(part);
        } else {
          // In v7, field name is accessed via 'fieldname' property
          const field = part as { fieldname: string; value: string };
          if (field.fieldname === 'name') {
            name = field.value;
          } else if (field.fieldname === 'description') {
            description = field.value;
          }
        }
      }

      const data = CreateProductSchema.parse({ name, description });
      const product = await productService.createProduct({
        ...data,
        imageUrl,
      });
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
      
      // Check if multipart form data
      const contentType = request.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data')) {
        const parts = request.parts();
        const updateData: any = {};
        let imageUrl: string | undefined;

        for await (const part of parts) {
          if (part.type === 'file') {
            imageUrl = await saveUploadedFile(part);
            updateData.imageUrl = imageUrl;
          } else {
            // In v7, field name is accessed via 'fieldname' property
            const field = part as { fieldname: string; value: string };
            if (field.fieldname === 'name' || field.fieldname === 'description') {
              updateData[field.fieldname] = field.value;
            }
          }
        }

        const data = CreateProductSchema.partial().parse(updateData);
        const product = await productService.updateProduct(params.id, data);
        return { product };
      } else {
        const data = CreateProductSchema.partial().parse(request.body);
        const product = await productService.updateProduct(params.id, data);
        return { product };
      }
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
      
      // Check if multipart form data
      const contentType = request.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data')) {
        const parts = request.parts();
        const variantData: any = { productId: params.id };
        let imageUrl: string | undefined;

        for await (const part of parts) {
          if (part.type === 'file') {
            imageUrl = await saveUploadedFile(part);
            variantData.imageUrl = imageUrl;
          } else {
            // In v7, field name is accessed via 'fieldname' property
            const field = part as { fieldname: string; value: string };
            if (field.fieldname === 'name') variantData.name = field.value;
            else if (field.fieldname === 'sku') variantData.sku = field.value;
            else if (field.fieldname === 'basePrice') variantData.basePrice = parseFloat(field.value);
            else if (field.fieldname === 'description') variantData.description = field.value;
          }
        }

        const data = CreateVariantSchema.parse(variantData);
        const variant = await productService.createVariant(data);
        return { variant };
      } else {
        const data = CreateVariantSchema.parse(request.body);
        const variant = await productService.createVariant({
          ...data,
          productId: params.id,
        });
        return { variant };
      }
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
