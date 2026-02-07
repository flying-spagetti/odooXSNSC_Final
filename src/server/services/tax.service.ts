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

  async list(filters: { isActive?: boolean }) {
    const { isActive = true } = filters;

    return this.prisma.taxRate.findMany({
      where: isActive !== undefined ? { isActive } : {},
      orderBy: { name: 'asc' },
    });
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
