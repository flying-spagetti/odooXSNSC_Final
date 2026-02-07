/**
 * Product Service
 * Manages products and product variants
 */

import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../domain/errors';

export interface CreateProductData {
  name: string;
  description?: string;
}

export interface CreateVariantData {
  productId: string;
  name: string;
  sku: string;
  basePrice: number;
  description?: string;
}

export class ProductService {
  constructor(private prisma: PrismaClient) {}

  async createProduct(data: CreateProductData) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async getProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          where: { isActive: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product', productId);
    }

    return product;
  }

  async listProducts(filters: { isActive?: boolean; limit?: number; offset?: number }) {
    const { isActive = true, limit = 20, offset = 0 } = filters;

    const where = isActive !== undefined ? { isActive } : {};

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          _count: { select: { variants: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async updateProduct(productId: string, data: Partial<CreateProductData>) {
    return this.prisma.product.update({
      where: { id: productId },
      data,
    });
  }

  async createVariant(data: CreateVariantData) {
    // Verify product exists
    await this.getProduct(data.productId);

    return this.prisma.productVariant.create({
      data: {
        productId: data.productId,
        name: data.name,
        sku: data.sku,
        basePrice: data.basePrice,
        description: data.description,
      },
      include: {
        product: true,
      },
    });
  }

  async getVariant(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: true,
      },
    });

    if (!variant) {
      throw new NotFoundError('ProductVariant', variantId);
    }

    return variant;
  }

  async listVariantsByProduct(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
