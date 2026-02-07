/**
 * Database Seed Script
 * Populates database with initial data for development/testing
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create users
  console.log('Creating users...');
  const adminPassword = await hashPassword('admin123');
  const internalPassword = await hashPassword('internal123');
  const portalPassword = await hashPassword('portal123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const internal = await prisma.user.upsert({
    where: { email: 'internal@example.com' },
    update: {},
    create: {
      email: 'internal@example.com',
      password: internalPassword,
      name: 'Internal Staff',
      role: 'INTERNAL',
    },
  });

  const portal = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: portalPassword,
      name: 'Customer User',
      role: 'PORTAL',
    },
  });

  console.log('✅ Users created:', { admin: admin.email, internal: internal.email, portal: portal.email });

  // Create tax rates
  console.log('Creating tax rates...');
  const existingTaxRate = await prisma.taxRate.findFirst({
    where: { name: 'VAT 18%' },
  });
  const taxRate = existingTaxRate || await prisma.taxRate.create({
    data: {
      name: 'VAT 18%',
      rate: 18,
      description: 'Standard VAT rate',
    },
  });

  console.log('✅ Tax rate created:', taxRate.name);

  // Create discounts
  console.log('Creating discounts...');
  const existingDiscount = await prisma.discount.findFirst({
    where: { name: '10% Off' },
  });
  const discount = existingDiscount || await prisma.discount.create({
    data: {
      name: '10% Off',
      type: 'PERCENTAGE',
      value: 10,
      description: '10 percent discount',
    },
  });

  console.log('✅ Discount created:', discount.name);

  // Create products
  console.log('Creating products...');
  const product1 = await prisma.product.create({
    data: {
      name: 'Cloud Storage',
      description: 'Secure cloud storage solution',
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'API Access',
      description: 'RESTful API access for developers',
    },
  });

  console.log('✅ Products created:', product1.name, product2.name);

  // Create product variants
  console.log('Creating product variants...');
  const variant1 = await prisma.productVariant.create({
    data: {
      productId: product1.id,
      name: 'Cloud Storage - 100GB',
      sku: 'CLOUD-100GB',
      basePrice: 9.99,
      description: '100GB of cloud storage',
    },
  });

  const variant2 = await prisma.productVariant.create({
    data: {
      productId: product1.id,
      name: 'Cloud Storage - 1TB',
      sku: 'CLOUD-1TB',
      basePrice: 49.99,
      description: '1TB of cloud storage',
    },
  });

  const variant3 = await prisma.productVariant.create({
    data: {
      productId: product2.id,
      name: 'API Access - Basic',
      sku: 'API-BASIC',
      basePrice: 19.99,
      description: 'Basic API access with 10,000 requests/month',
    },
  });

  console.log('✅ Variants created:', variant1.sku, variant2.sku, variant3.sku);

  // Create recurring plan
  console.log('Creating recurring plan...');
  const plan = await prisma.recurringPlan.create({
    data: {
      name: 'Monthly Subscription',
      billingPeriod: 'MONTHLY',
      intervalCount: 1,
      description: 'Standard monthly billing cycle',
    },
  });

  console.log('✅ Plan created:', plan.name);

  // Create sample subscription in DRAFT status
  console.log('Creating sample subscription...');
  const subscription = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-20260207-00001',
      userId: portal.id,
      planId: plan.id,
      status: 'DRAFT',
      notes: 'Sample subscription for testing',
    },
  });

  // Add lines to subscription
  await prisma.subscriptionLine.createMany({
    data: [
      {
        subscriptionId: subscription.id,
        variantId: variant1.id,
        quantity: 1,
        unitPrice: variant1.basePrice,
        taxRateId: taxRate.id,
      },
      {
        subscriptionId: subscription.id,
        variantId: variant3.id,
        quantity: 2,
        unitPrice: variant3.basePrice,
        discountId: discount.id,
        taxRateId: taxRate.id,
      },
    ],
  });

  console.log('✅ Subscription created:', subscription.subscriptionNumber);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('  Admin: admin@example.com / admin123');
  console.log('  Internal: internal@example.com / internal123');
  console.log('  Customer: customer@example.com / portal123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
