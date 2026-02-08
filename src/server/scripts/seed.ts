/**
 * Enhanced Database Seed Script
 * Populates database with comprehensive data for development/testing
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting enhanced database seed...\n');

  // ============================================================================
  // USERS
  // ============================================================================
  console.log('📝 Creating users...');
  const password = await hashPassword('password123'); // Same password for all demo users
  
  const users = {
    admin: await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: await hashPassword('admin123'),
        name: 'Admin User',
        role: 'ADMIN',
        phone: '+91 98765 43210',
        address: '123 Admin Street, Mumbai, India',
      },
    }),
    
    internal1: await prisma.user.upsert({
      where: { email: 'sales@example.com' },
      update: {},
      create: {
        email: 'sales@example.com',
        password,
        name: 'Sales Manager',
        role: 'INTERNAL',
        phone: '+91 98765 43211',
        address: '456 Sales Avenue, Mumbai, India',
      },
    }),
    
    internal2: await prisma.user.upsert({
      where: { email: 'support@example.com' },
      update: {},
      create: {
        email: 'support@example.com',
        password,
        name: 'Support Staff',
        role: 'INTERNAL',
        phone: '+91 98765 43212',
      },
    }),

    customer1: await prisma.user.upsert({
      where: { email: 'customer1@example.com' },
      update: {},
      create: {
        email: 'customer1@example.com',
        password,
        name: 'John Doe',
        role: 'PORTAL',
        phone: '+91 98765 43220',
        address: '789 Customer Lane, Delhi, India',
      },
    }),

    customer2: await prisma.user.upsert({
      where: { email: 'customer2@example.com' },
      update: {},
      create: {
        email: 'customer2@example.com',
        password,
        name: 'Jane Smith',
        role: 'PORTAL',
        phone: '+91 98765 43221',
        address: '321 Business Park, Bangalore, India',
      },
    }),

    customer3: await prisma.user.upsert({
      where: { email: 'customer3@example.com' },
      update: {},
      create: {
        email: 'customer3@example.com',
        password,
        name: 'Raj Kumar',
        role: 'PORTAL',
        phone: '+91 98765 43222',
        address: '654 Tech Hub, Hyderabad, India',
      },
    }),

    customer4: await prisma.user.upsert({
      where: { email: 'customer4@example.com' },
      update: {},
      create: {
        email: 'customer4@example.com',
        password,
        name: 'Priya Sharma',
        role: 'PORTAL',
        phone: '+91 98765 43223',
      },
    }),

    customer5: await prisma.user.upsert({
      where: { email: 'customer5@example.com' },
      update: {},
      create: {
        email: 'customer5@example.com',
        password,
        name: 'Amit Patel',
        role: 'PORTAL',
        phone: '+91 98765 43224',
      },
    }),
  };

  console.log(`✅ Created ${Object.keys(users).length} users\n`);

  // ============================================================================
  // CONTACTS
  // ============================================================================
  console.log('👥 Creating contacts...');
  const contacts = [];
  
  // Find or create contacts
  let contact1 = await prisma.contact.findFirst({
    where: { email: 'billing@techcorp.in' },
  });
  if (!contact1) {
    contact1 = await prisma.contact.create({
      data: {
        userId: users.customer1.id,
        name: 'Tech Corp India',
        email: 'billing@techcorp.in',
        phone: '+91 11 2345 6789',
        address: '100 Corporate Tower, Delhi, India',
      },
    });
  }
  contacts.push(contact1);

  let contact2 = await prisma.contact.findFirst({
    where: { email: 'accounts@startupsolutions.com' },
  });
  if (!contact2) {
    contact2 = await prisma.contact.create({
      data: {
        userId: users.customer2.id,
        name: 'Startup Solutions Pvt Ltd',
        email: 'accounts@startupsolutions.com',
        phone: '+91 80 2345 6789',
        address: '200 Innovation Center, Bangalore, India',
      },
    });
  }
  contacts.push(contact2);
  
  console.log(`✅ Created ${contacts.length} contacts\n`);

  // ============================================================================
  // TAX RATES
  // ============================================================================
  console.log('💰 Creating tax rates...');
  const taxRates = {
    gst18: await prisma.taxRate.upsert({
      where: { id: 'tax-gst18' },
      update: {},
      create: {
        id: 'tax-gst18',
        name: 'GST 18%',
        rate: 18.0,
        description: 'Standard GST rate for most services',
      },
    }),
    gst12: await prisma.taxRate.upsert({
      where: { id: 'tax-gst12' },
      update: {},
      create: {
        id: 'tax-gst12',
        name: 'GST 12%',
        rate: 12.0,
        description: 'Reduced GST rate for certain services',
      },
    }),
    gst5: await prisma.taxRate.upsert({
      where: { id: 'tax-gst5' },
      update: {},
      create: {
        id: 'tax-gst5',
        name: 'GST 5%',
        rate: 5.0,
        description: 'Lower GST rate for essential services',
      },
    }),
    noTax: await prisma.taxRate.upsert({
      where: { id: 'tax-zero' },
      update: {},
      create: {
        id: 'tax-zero',
        name: 'No Tax',
        rate: 0.0,
        description: 'Zero tax rate',
      },
    }),
  };
  console.log(`✅ Created ${Object.keys(taxRates).length} tax rates\n`);

  // ============================================================================
  // DISCOUNTS
  // ============================================================================
  console.log('🎟️ Creating discounts...');
  const discounts = {
    earlyBird10: await prisma.discount.upsert({
      where: { id: 'disc-early10' },
      update: {},
      create: {
        id: 'disc-early10',
        name: 'Early Bird 10%',
        code: 'EARLY10',
        type: 'PERCENTAGE',
        value: 10,
        description: '10% discount for early subscribers',
        maxUses: 100,
        maxUsesPerUser: 1,
      },
    }),
    bulk20: await prisma.discount.upsert({
      where: { id: 'disc-bulk20' },
      update: {},
      create: {
        id: 'disc-bulk20',
        name: 'Bulk Purchase 20%',
        code: 'BULK20',
        type: 'PERCENTAGE',
        value: 20,
        description: '20% discount on bulk purchases',
        minPurchaseAmount: 10000,
      },
    }),
    fixed500: await prisma.discount.upsert({
      where: { id: 'disc-fixed500' },
      update: {},
      create: {
        id: 'disc-fixed500',
        name: 'Fixed ₹500 Off',
        code: 'SAVE500',
        type: 'FIXED',
        value: 500,
        description: 'Flat ₹500 discount',
        minPurchaseAmount: 5000,
      },
    }),
    newCustomer15: await prisma.discount.upsert({
      where: { id: 'disc-new15' },
      update: {},
      create: {
        id: 'disc-new15',
        name: 'New Customer 15%',
        code: 'NEW15',
        type: 'PERCENTAGE',
        value: 15,
        description: '15% discount for new customers',
        maxUses: 50,
        maxUsesPerUser: 1,
      },
    }),
  };
  console.log(`✅ Created ${Object.keys(discounts).length} discounts\n`);

  // ============================================================================
  // RECURRING PLANS
  // ============================================================================
  console.log('📅 Creating recurring plans...');
  const plans = {
    daily: await prisma.recurringPlan.upsert({
      where: { id: 'plan-daily' },
      update: {},
      create: {
        id: 'plan-daily',
        name: 'Daily Billing',
        billingPeriod: 'DAILY',
        intervalCount: 1,
        description: 'Daily recurring subscription',
      },
    }),
    weekly: await prisma.recurringPlan.upsert({
      where: { id: 'plan-weekly' },
      update: {},
      create: {
        id: 'plan-weekly',
        name: 'Weekly Billing',
        billingPeriod: 'WEEKLY',
        intervalCount: 1,
        description: 'Weekly recurring subscription',
      },
    }),
    monthly: await prisma.recurringPlan.upsert({
      where: { id: 'plan-monthly' },
      update: {},
      create: {
        id: 'plan-monthly',
        name: 'Monthly Billing',
        billingPeriod: 'MONTHLY',
        intervalCount: 1,
        description: 'Standard monthly billing cycle',
      },
    }),
    quarterly: await prisma.recurringPlan.upsert({
      where: { id: 'plan-quarterly' },
      update: {},
      create: {
        id: 'plan-quarterly',
        name: 'Quarterly Billing',
        billingPeriod: 'MONTHLY',
        intervalCount: 3,
        description: 'Billed every 3 months',
      },
    }),
    yearly: await prisma.recurringPlan.upsert({
      where: { id: 'plan-yearly' },
      update: {},
      create: {
        id: 'plan-yearly',
        name: 'Yearly Billing',
        billingPeriod: 'YEARLY',
        intervalCount: 1,
        description: 'Annual subscription with yearly billing',
      },
    }),
  };
  console.log(`✅ Created ${Object.keys(plans).length} recurring plans\n`);

  // ============================================================================
  // PRODUCTS & VARIANTS
  // ============================================================================
  console.log('📦 Creating products and variants...');
  
  // Cloud Services Category - Use findFirst/create pattern for products
  let cloudStorage = await prisma.product.findFirst({
    where: { name: 'Cloud Storage' },
  });
  if (!cloudStorage) {
    cloudStorage = await prisma.product.create({
      data: {
        name: 'Cloud Storage',
        description: 'Secure and scalable cloud storage solutions for businesses of all sizes. Enterprise-grade security with 99.9% uptime guarantee.',
      },
    });
  } else {
    // Update description if product exists
    cloudStorage = await prisma.product.update({
      where: { id: cloudStorage.id },
      data: {
        description: 'Secure and scalable cloud storage solutions for businesses of all sizes. Enterprise-grade security with 99.9% uptime guarantee.',
      },
    });
  }

  const cloudVariants = await Promise.all([
    prisma.productVariant.upsert({
      where: { sku: 'CLOUD-100GB' },
      update: {
        name: 'Cloud Storage - 100GB',
        basePrice: 999.00,
        description: '100GB of secure cloud storage with automatic backups',
        productId: cloudStorage.id,
      },
      create: {
        productId: cloudStorage.id,
        name: 'Cloud Storage - 100GB',
        sku: 'CLOUD-100GB',
        basePrice: 999.00,
        description: '100GB of secure cloud storage with automatic backups',
      },
    }),
    prisma.productVariant.upsert({
      where: { sku: 'CLOUD-500GB' },
      update: {
        name: 'Cloud Storage - 500GB',
        basePrice: 3999.00,
        description: '500GB of secure cloud storage with advanced features',
        productId: cloudStorage.id,
      },
      create: {
        productId: cloudStorage.id,
        name: 'Cloud Storage - 500GB',
        sku: 'CLOUD-500GB',
        basePrice: 3999.00,
        description: '500GB of secure cloud storage with advanced features',
      },
    }),
    prisma.productVariant.upsert({
      where: { sku: 'CLOUD-1TB' },
      update: {
        name: 'Cloud Storage - 1TB',
        basePrice: 6999.00,
        description: '1TB of enterprise cloud storage with priority support',
        productId: cloudStorage.id,
      },
      create: {
        productId: cloudStorage.id,
        name: 'Cloud Storage - 1TB',
        sku: 'CLOUD-1TB',
        basePrice: 6999.00,
        description: '1TB of enterprise cloud storage with priority support',
      },
    }),
    prisma.productVariant.upsert({
      where: { sku: 'CLOUD-5TB' },
      update: {
        name: 'Cloud Storage - 5TB',
        basePrice: 24999.00,
        description: '5TB of enterprise cloud storage with dedicated support',
        productId: cloudStorage.id,
      },
      create: {
        productId: cloudStorage.id,
        name: 'Cloud Storage - 5TB',
        sku: 'CLOUD-5TB',
        basePrice: 24999.00,
        description: '5TB of enterprise cloud storage with dedicated support',
      },
    }),
  ]);

  // API Services Category
  let apiService = await prisma.product.findFirst({
    where: { name: 'API Access' },
  });
  if (!apiService) {
    apiService = await prisma.product.create({
      data: {
        name: 'API Access',
        description: 'RESTful API access for developers. Comprehensive documentation, rate limiting, and webhook support included.',
      },
    });
  } else {
    apiService = await prisma.product.update({
      where: { id: apiService.id },
      data: {
        description: 'RESTful API access for developers. Comprehensive documentation, rate limiting, and webhook support included.',
      },
    });
  }

  const apiVariants = await Promise.all([
    prisma.productVariant.upsert({
      where: { sku: 'API-BASIC' },
      update: {
        name: 'API Access - Basic',
        basePrice: 1999.00,
        description: 'Basic API access with 10,000 requests/month',
        productId: apiService.id,
      },
      create: {
        productId: apiService.id,
        name: 'API Access - Basic',
        sku: 'API-BASIC',
        basePrice: 1999.00,
        description: 'Basic API access with 10,000 requests/month',
      },
    }),
    prisma.productVariant.upsert({
      where: { sku: 'API-PRO' },
      update: {
        name: 'API Access - Professional',
        basePrice: 4999.00,
        description: 'Professional API access with 100,000 requests/month',
        productId: apiService.id,
      },
      create: {
        productId: apiService.id,
        name: 'API Access - Professional',
        sku: 'API-PRO',
        basePrice: 4999.00,
        description: 'Professional API access with 100,000 requests/month',
      },
    }),
    prisma.productVariant.upsert({
      where: { sku: 'API-ENTERPRISE' },
      update: {
        name: 'API Access - Enterprise',
        basePrice: 14999.00,
        description: 'Enterprise API access with unlimited requests and priority support',
        productId: apiService.id,
      },
      create: {
        productId: apiService.id,
        name: 'API Access - Enterprise',
        sku: 'API-ENTERPRISE',
        basePrice: 14999.00,
        description: 'Enterprise API access with unlimited requests and priority support',
      },
    }),
  ]);

  // Email Marketing Category
  let emailMarketing = await prisma.product.findFirst({
    where: { name: 'Email Marketing Platform' },
  });
  if (!emailMarketing) {
    emailMarketing = await prisma.product.create({
      data: {
        name: 'Email Marketing Platform',
        description: 'Complete email marketing solution with automation, analytics, and A/B testing capabilities.',
      },
    });
  }

  const emailVariants = await Promise.all([
    prisma.productVariant.upsert({
      where: { sku: 'EMAIL-STARTER' },
      update: {
        name: 'Email Marketing - Starter',
        basePrice: 2999.00,
        description: 'Up to 5,000 contacts, basic automation',
        productId: emailMarketing.id,
      },
      create: {
        productId: emailMarketing.id,
        name: 'Email Marketing - Starter',
        sku: 'EMAIL-STARTER',
        basePrice: 2999.00,
        description: 'Up to 5,000 contacts, basic automation',
      },
    }),
    prisma.productVariant.upsert({
      where: { sku: 'EMAIL-GROWTH' },
      update: {
        name: 'Email Marketing - Growth',
        basePrice: 7999.00,
        description: 'Up to 25,000 contacts, advanced automation',
        productId: emailMarketing.id,
      },
      create: {
        productId: emailMarketing.id,
        name: 'Email Marketing - Growth',
        sku: 'EMAIL-GROWTH',
        basePrice: 7999.00,
        description: 'Up to 25,000 contacts, advanced automation',
      },
    }),
    prisma.productVariant.upsert({
      where: { sku: 'EMAIL-SCALE' },
      update: {
        name: 'Email Marketing - Scale',
        basePrice: 19999.00,
        description: 'Unlimited contacts, enterprise features',
        productId: emailMarketing.id,
      },
      create: {
        productId: emailMarketing.id,
        name: 'Email Marketing - Scale',
        sku: 'EMAIL-SCALE',
        basePrice: 19999.00,
        description: 'Unlimited contacts, enterprise features',
      },
    }),
  ]);

  // Analytics Platform Category
  let analytics = await prisma.product.findFirst({
    where: { name: 'Business Analytics Platform' },
  });
  if (!analytics) {
    analytics = await prisma.product.create({
      data: {
        name: 'Business Analytics Platform',
        description: 'Advanced analytics and reporting platform with real-time dashboards and custom reports.',
      },
    });
  }

  const analyticsVariants = await Promise.all([
    prisma.productVariant.upsert({
      where: { sku: 'ANALYTICS-BASIC' },
      update: {
        name: 'Analytics - Basic',
        basePrice: 3999.00,
        description: 'Basic analytics with standard reports',
        productId: analytics.id,
      },
      create: {
        productId: analytics.id,
        name: 'Analytics - Basic',
        sku: 'ANALYTICS-BASIC',
        basePrice: 3999.00,
        description: 'Basic analytics with standard reports',
      },
    }),
    prisma.productVariant.upsert({
      where: { sku: 'ANALYTICS-PRO' },
      update: {
        name: 'Analytics - Professional',
        basePrice: 9999.00,
        description: 'Advanced analytics with custom dashboards',
        productId: analytics.id,
      },
      create: {
        productId: analytics.id,
        name: 'Analytics - Professional',
        sku: 'ANALYTICS-PRO',
        basePrice: 9999.00,
        description: 'Advanced analytics with custom dashboards',
      },
    }),
  ]);

  // CRM Software Category
  let crm = await prisma.product.findFirst({
    where: { name: 'CRM Software' },
  });
  if (!crm) {
    crm = await prisma.product.create({
      data: {
        name: 'CRM Software',
        description: 'Complete customer relationship management solution with sales pipeline, contact management, and reporting.',
      },
    });
  }

  const crmVariants = await Promise.all([
    prisma.productVariant.upsert({
      where: { sku: 'CRM-TEAM' },
      update: {
        name: 'CRM - Team',
        basePrice: 4999.00,
        description: 'Up to 10 users, basic CRM features',
        productId: crm.id,
      },
      create: {
        productId: crm.id,
        name: 'CRM - Team',
        sku: 'CRM-TEAM',
        basePrice: 4999.00,
        description: 'Up to 10 users, basic CRM features',
      },
    }),
    prisma.productVariant.upsert({
      where: { sku: 'CRM-BUSINESS' },
      update: {
        name: 'CRM - Business',
        basePrice: 12999.00,
        description: 'Up to 50 users, advanced features',
        productId: crm.id,
      },
      create: {
        productId: crm.id,
        name: 'CRM - Business',
        sku: 'CRM-BUSINESS',
        basePrice: 12999.00,
        description: 'Up to 50 users, advanced features',
      },
    }),
    prisma.productVariant.upsert({
      where: { sku: 'CRM-ENTERPRISE' },
      update: {
        name: 'CRM - Enterprise',
        basePrice: 29999.00,
        description: 'Unlimited users, all features, dedicated support',
        productId: crm.id,
      },
      create: {
        productId: crm.id,
        name: 'CRM - Enterprise',
        sku: 'CRM-ENTERPRISE',
        basePrice: 29999.00,
        description: 'Unlimited users, all features, dedicated support',
      },
    }),
  ]);

  // Website Hosting Category
  let hosting = await prisma.product.findFirst({
    where: { name: 'Website Hosting' },
  });
  if (!hosting) {
    hosting = await prisma.product.create({
      data: {
        name: 'Website Hosting',
        description: 'Reliable web hosting with SSL certificates, daily backups, and 24/7 support.',
      },
    });
  }

  const hostingVariants = await Promise.all([
    prisma.productVariant.upsert({
      where: { sku: 'HOSTING-SHARED' },
      update: {
        name: 'Hosting - Shared',
        basePrice: 999.00,
        description: 'Shared hosting with 10GB storage',
        productId: hosting.id,
      },
      create: {
        productId: hosting.id,
        name: 'Hosting - Shared',
        sku: 'HOSTING-SHARED',
        basePrice: 999.00,
        description: 'Shared hosting with 10GB storage',
      },
    }),
    prisma.productVariant.upsert({
      where: { sku: 'HOSTING-VPS' },
      update: {
        name: 'Hosting - VPS',
        basePrice: 4999.00,
        description: 'VPS hosting with 50GB storage and root access',
        productId: hosting.id,
      },
      create: {
        productId: hosting.id,
        name: 'Hosting - VPS',
        sku: 'HOSTING-VPS',
        basePrice: 4999.00,
        description: 'VPS hosting with 50GB storage and root access',
      },
    }),
    prisma.productVariant.upsert({
      where: { sku: 'HOSTING-DEDICATED' },
      update: {
        name: 'Hosting - Dedicated',
        basePrice: 19999.00,
        description: 'Dedicated server with 500GB storage',
        productId: hosting.id,
      },
      create: {
        productId: hosting.id,
        name: 'Hosting - Dedicated',
        sku: 'HOSTING-DEDICATED',
        basePrice: 19999.00,
        description: 'Dedicated server with 500GB storage',
      },
    }),
  ]);

  const allVariants = [
    ...cloudVariants,
    ...apiVariants,
    ...emailVariants,
    ...analyticsVariants,
    ...crmVariants,
    ...hostingVariants,
  ];

  console.log(`✅ Created/Updated 6 products with ${allVariants.length} variants\n`);

  // ============================================================================
  // SUBSCRIPTION TEMPLATES
  // ============================================================================
  console.log('📋 Creating subscription templates...');
  
  const template1 = await prisma.subscriptionTemplate.upsert({
    where: { id: 'tpl-starter' },
    update: {
      name: 'Starter Package',
      description: 'Perfect for small businesses getting started',
      validityDays: 30,
      planId: plans.monthly.id,
    },
    create: {
      id: 'tpl-starter',
      name: 'Starter Package',
      description: 'Perfect for small businesses getting started',
      validityDays: 30,
      planId: plans.monthly.id,
      isActive: true,
    },
  });

  // Delete existing lines and recreate
  await prisma.subscriptionTemplateLine.deleteMany({
    where: { templateId: template1.id },
  });
  await prisma.subscriptionTemplateLine.createMany({
    data: [
      {
        templateId: template1.id,
        variantId: cloudVariants[0].id, // 100GB Cloud
        quantity: 1,
        unitPrice: cloudVariants[0].basePrice,
        taxRateId: taxRates.gst18.id,
      },
      {
        templateId: template1.id,
        variantId: apiVariants[0].id, // Basic API
        quantity: 1,
        unitPrice: apiVariants[0].basePrice,
        taxRateId: taxRates.gst18.id,
      },
    ],
  });

  const template2 = await prisma.subscriptionTemplate.upsert({
    where: { id: 'tpl-business' },
    update: {
      name: 'Business Package',
      description: 'Comprehensive solution for growing businesses',
      validityDays: 30,
      planId: plans.monthly.id,
    },
    create: {
      id: 'tpl-business',
      name: 'Business Package',
      description: 'Comprehensive solution for growing businesses',
      validityDays: 30,
      planId: plans.monthly.id,
      isActive: true,
    },
  });

  await prisma.subscriptionTemplateLine.deleteMany({
    where: { templateId: template2.id },
  });
  await prisma.subscriptionTemplateLine.createMany({
    data: [
      {
        templateId: template2.id,
        variantId: cloudVariants[2].id, // 1TB Cloud
        quantity: 1,
        unitPrice: cloudVariants[2].basePrice,
        taxRateId: taxRates.gst18.id,
      },
      {
        templateId: template2.id,
        variantId: apiVariants[1].id, // Pro API
        quantity: 1,
        unitPrice: apiVariants[1].basePrice,
        taxRateId: taxRates.gst18.id,
      },
      {
        templateId: template2.id,
        variantId: emailVariants[1].id, // Growth Email
        quantity: 1,
        unitPrice: emailVariants[1].basePrice,
        discountId: discounts.earlyBird10.id,
        taxRateId: taxRates.gst18.id,
      },
    ],
  });

  const template3 = await prisma.subscriptionTemplate.upsert({
    where: { id: 'tpl-enterprise' },
    update: {
      name: 'Enterprise Package',
      description: 'Full-featured solution for large organizations',
      validityDays: 60,
      planId: plans.quarterly.id,
    },
    create: {
      id: 'tpl-enterprise',
      name: 'Enterprise Package',
      description: 'Full-featured solution for large organizations',
      validityDays: 60,
      planId: plans.quarterly.id,
      isActive: true,
    },
  });

  await prisma.subscriptionTemplateLine.deleteMany({
    where: { templateId: template3.id },
  });
  await prisma.subscriptionTemplateLine.createMany({
    data: [
      {
        templateId: template3.id,
        variantId: cloudVariants[3].id, // 5TB Cloud
        quantity: 1,
        unitPrice: cloudVariants[3].basePrice,
        taxRateId: taxRates.gst18.id,
      },
      {
        templateId: template3.id,
        variantId: apiVariants[2].id, // Enterprise API
        quantity: 1,
        unitPrice: apiVariants[2].basePrice,
        taxRateId: taxRates.gst18.id,
      },
      {
        templateId: template3.id,
        variantId: crmVariants[2].id, // Enterprise CRM
        quantity: 1,
        unitPrice: crmVariants[2].basePrice,
        discountId: discounts.bulk20.id,
        taxRateId: taxRates.gst18.id,
      },
    ],
  });

  console.log(`✅ Created/Updated 3 subscription templates\n`);

  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================
  console.log('📝 Creating subscriptions...');

  // Helper function to generate subscription number
  const getSubNumber = (index: number) => {
    const now = new Date();
    return `SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(index).padStart(5, '0')}`;
  };

  const subscriptions = [];

  // Check if subscriptions already exist to avoid duplicates
  const existingSubs = await prisma.subscription.findMany({
    where: {
      subscriptionNumber: {
        startsWith: `SUB-${new Date().getFullYear()}`,
      },
    },
  });

  // Only create new subscriptions if we don't have many already
  if (existingSubs.length < 5) {
    // Draft subscription
    const sub1 = await prisma.subscription.create({
      data: {
        subscriptionNumber: getSubNumber(existingSubs.length + 1),
        userId: users.customer1.id,
        contactId: contacts[0].id,
        planId: plans.monthly.id,
        status: 'DRAFT',
        notes: 'Initial draft subscription for review',
        salespersonId: users.internal1.id,
      },
    });
    await prisma.subscriptionLine.createMany({
      data: [
        {
          subscriptionId: sub1.id,
          variantId: cloudVariants[0].id,
          quantity: 1,
          unitPrice: cloudVariants[0].basePrice,
          taxRateId: taxRates.gst18.id,
        },
      ],
    });
    subscriptions.push(sub1);

    // Quotation subscription
    const sub2 = await prisma.subscription.create({
      data: {
        subscriptionNumber: getSubNumber(existingSubs.length + 2),
        userId: users.customer2.id,
        contactId: contacts[1].id,
        planId: plans.monthly.id,
        status: 'QUOTATION',
        quotationTemplate: 'Standard Quotation Template',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        paymentTermDays: 15,
        notes: 'Quotation sent to customer, awaiting confirmation',
        salespersonId: users.internal1.id,
      },
    });
    await prisma.subscriptionLine.createMany({
      data: [
        {
          subscriptionId: sub2.id,
          variantId: apiVariants[1].id,
          quantity: 2,
          unitPrice: apiVariants[1].basePrice,
          discountId: discounts.earlyBird10.id,
          taxRateId: taxRates.gst18.id,
        },
        {
          subscriptionId: sub2.id,
          variantId: emailVariants[1].id,
          quantity: 1,
          unitPrice: emailVariants[1].basePrice,
          taxRateId: taxRates.gst18.id,
        },
      ],
    });
    subscriptions.push(sub2);

    // Confirmed subscription
    const sub3 = await prisma.subscription.create({
      data: {
        subscriptionNumber: getSubNumber(existingSubs.length + 3),
        userId: users.customer3.id,
        planId: plans.monthly.id,
        status: 'CONFIRMED',
        startDate: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentTermDays: 30,
        paymentMethod: 'BANK_TRANSFER',
        notes: 'Confirmed subscription, payment pending',
        salespersonId: users.internal1.id,
      },
    });
    await prisma.subscriptionLine.createMany({
      data: [
        {
          subscriptionId: sub3.id,
          variantId: crmVariants[0].id,
          quantity: 1,
          unitPrice: crmVariants[0].basePrice,
          taxRateId: taxRates.gst18.id,
        },
      ],
    });
    subscriptions.push(sub3);

    // Active subscriptions
    const sub4 = await prisma.subscription.create({
      data: {
        subscriptionNumber: getSubNumber(existingSubs.length + 4),
        userId: users.customer1.id,
        planId: plans.monthly.id,
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        paymentTermDays: 30,
        paymentMethod: 'CREDIT_CARD',
        paymentDone: true,
        notes: 'Active subscription with regular payments',
        salespersonId: users.internal1.id,
      },
    });
    await prisma.subscriptionLine.createMany({
      data: [
        {
          subscriptionId: sub4.id,
          variantId: cloudVariants[2].id,
          quantity: 1,
          unitPrice: cloudVariants[2].basePrice,
          taxRateId: taxRates.gst18.id,
        },
        {
          subscriptionId: sub4.id,
          variantId: analyticsVariants[1].id,
          quantity: 1,
          unitPrice: analyticsVariants[1].basePrice,
          discountId: discounts.newCustomer15.id,
          taxRateId: taxRates.gst18.id,
        },
      ],
    });
    subscriptions.push(sub4);

    const sub5 = await prisma.subscription.create({
      data: {
        subscriptionNumber: getSubNumber(existingSubs.length + 5),
        userId: users.customer4.id,
        planId: plans.quarterly.id,
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paymentTermDays: 15,
        paymentMethod: 'BANK_TRANSFER',
        paymentDone: true,
        notes: 'Quarterly billing subscription',
      },
    });
    await prisma.subscriptionLine.createMany({
      data: [
        {
          subscriptionId: sub5.id,
          variantId: hostingVariants[1].id,
          quantity: 1,
          unitPrice: hostingVariants[1].basePrice,
          taxRateId: taxRates.gst18.id,
        },
      ],
    });
    subscriptions.push(sub5);

    const sub6 = await prisma.subscription.create({
      data: {
        subscriptionNumber: getSubNumber(existingSubs.length + 6),
        userId: users.customer5.id,
        planId: plans.yearly.id,
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
        nextBillingDate: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000), // ~6 months from now
        paymentTermDays: 30,
        paymentMethod: 'CREDIT_CARD',
        paymentDone: true,
        notes: 'Annual subscription with yearly billing',
      },
    });
    await prisma.subscriptionLine.createMany({
      data: [
        {
          subscriptionId: sub6.id,
          variantId: crmVariants[1].id,
          quantity: 1,
          unitPrice: crmVariants[1].basePrice,
          discountId: discounts.bulk20.id,
          taxRateId: taxRates.gst18.id,
        },
        {
          subscriptionId: sub6.id,
          variantId: emailVariants[2].id,
          quantity: 1,
          unitPrice: emailVariants[2].basePrice,
          taxRateId: taxRates.gst18.id,
        },
      ],
    });
    subscriptions.push(sub6);

    // Closed subscription
    const sub7 = await prisma.subscription.create({
      data: {
        subscriptionNumber: getSubNumber(existingSubs.length + 7),
        userId: users.customer2.id,
        planId: plans.monthly.id,
        status: 'CLOSED',
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        notes: 'Subscription closed after completion',
      },
    });
    await prisma.subscriptionLine.createMany({
      data: [
        {
          subscriptionId: sub7.id,
          variantId: apiVariants[0].id,
          quantity: 1,
          unitPrice: apiVariants[0].basePrice,
          taxRateId: taxRates.gst18.id,
        },
      ],
    });
    subscriptions.push(sub7);
  }

  console.log(`✅ Created ${subscriptions.length} new subscriptions\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n🎉 Enhanced seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   • Users: ${Object.keys(users).length} (1 Admin, 2 Internal, 5 Customers)`);
  console.log(`   • Contacts: ${contacts.length}`);
  console.log(`   • Tax Rates: ${Object.keys(taxRates).length}`);
  console.log(`   • Discounts: ${Object.keys(discounts).length}`);
  console.log(`   • Recurring Plans: ${Object.keys(plans).length}`);
  console.log(`   • Products: 6`);
  console.log(`   • Product Variants: ${allVariants.length}`);
  console.log(`   • Subscription Templates: 3`);
  console.log(`   • New Subscriptions: ${subscriptions.length}\n`);
  
  console.log('📝 Login credentials (all demo users use "password123" except admin):');
  console.log('   Admin: admin@example.com / admin123');
  console.log('   Sales: sales@example.com / password123');
  console.log('   Support: support@example.com / password123');
  console.log('   Customer 1: customer1@example.com / password123');
  console.log('   Customer 2: customer2@example.com / password123');
  console.log('   Customer 3: customer3@example.com / password123');
  console.log('   Customer 4: customer4@example.com / password123');
  console.log('   Customer 5: customer5@example.com / password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });