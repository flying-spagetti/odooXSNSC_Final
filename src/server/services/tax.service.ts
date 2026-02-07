/**
 * Tax Rate Service
 * Manages tax rates
 */

import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../domain/errors';

export interface CreateTaxRateData {
  name: string;
  rate: number;
  description?: string;
}

export class TaxService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTaxRateData) {
    return this.prisma.taxRate.create({
      data: {
        name: data.name,
        rate: data.rate,
        description: data.description,
      },
    });
  }

  async getById(taxRateId: string) {
    const taxRate = await this.prisma.taxRate.findUnique({
      where: { id: taxRateId },
    });

    if (!taxRate) {
      throw new NotFoundError('TaxRate', taxRateId);
    }

    return taxRate;
  }

  async list(filters: { isActive?: boolean; limit?: number; offset?: number }) {
    const { isActive = true, limit = 100, offset = 0 } = filters;

    const where = isActive !== undefined ? { isActive } : {};

    const [items, total] = await Promise.all([
      this.prisma.taxRate.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.taxRate.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async update(taxRateId: string, data: Partial<CreateTaxRateData>) {
    return this.prisma.taxRate.update({
      where: { id: taxRateId },
      data,
    });
  }

  async deactivate(taxRateId: string) {
    return this.prisma.taxRate.update({
      where: { id: taxRateId },
      data: { isActive: false },
    });
  }
}
