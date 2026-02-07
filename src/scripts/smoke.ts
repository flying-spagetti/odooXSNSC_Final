/**
 * Smoke Test Script
 * Tests key API flows to ensure system is working correctly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';

interface ApiResponse {
  ok: boolean;
  status: number;
  data?: any;
  error?: any;
}

async function apiCall(
  method: string,
  path: string,
  body?: any,
  token?: string
): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? data : undefined,
      error: !response.ok ? data : undefined,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    };
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

async function main() {
  console.log('🧪 Starting smoke tests...\n');

  let adminToken: string;
  let internalToken: string;
  let portalToken: string;

  // Test 1: Health check
  console.log('Test 1: Health check');
  const healthResponse = await fetch(`http://localhost:3000/health`);
  const health = await healthResponse.json();
  assert(healthResponse.ok, 'Health endpoint returns 200');
  assert(health.status === 'ok', 'Health status is ok');

  // Test 2: Admin login
  console.log('\nTest 2: Admin login');
  const adminLogin = await apiCall('POST', '/auth/login', {
    email: 'admin@example.com',
    password: 'admin123',
  });
  assert(adminLogin.ok, 'Admin can login');
  assert(adminLogin.data.token, 'Admin receives JWT token');
  adminToken = adminLogin.data.token;

  // Test 3: Internal login
  console.log('\nTest 3: Internal user login');
  const internalLogin = await apiCall('POST', '/auth/login', {
    email: 'internal@example.com',
    password: 'internal123',
  });
  assert(internalLogin.ok, 'Internal user can login');
  internalToken = internalLogin.data.token;

  // Test 4: Portal login
  console.log('\nTest 4: Portal user login');
  const portalLogin = await apiCall('POST', '/auth/login', {
    email: 'customer@example.com',
    password: 'portal123',
  });
  assert(portalLogin.ok, 'Portal user can login');
  portalToken = portalLogin.data.token;

  // Test 5: List products
  console.log('\nTest 5: List products');
  const products = await apiCall('GET', '/products?limit=10', undefined, adminToken);
  assert(products.ok, 'Can list products');
  assert(Array.isArray(products.data.items), 'Products returns array');

  // Test 6: List subscriptions
  console.log('\nTest 6: List subscriptions');
  const subscriptions = await apiCall('GET', '/subscriptions', undefined, internalToken);
  assert(subscriptions.ok, 'Internal user can list subscriptions');
  assert(subscriptions.data.items.length > 0, 'Found at least one subscription');

  const subscriptionId = subscriptions.data.items[0].id;

  // Test 7: Subscription state transitions
  console.log('\nTest 7: Subscription workflow (DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE)');
  
  // DRAFT -> QUOTATION
  const quoteResult = await apiCall(
    'POST',
    `/subscriptions/${subscriptionId}/actions/quote`,
    {},
    internalToken
  );
  assert(quoteResult.ok, 'Can transition to QUOTATION');
  assert(quoteResult.data.subscription.status === 'QUOTATION', 'Status is QUOTATION');

  // QUOTATION -> CONFIRMED
  const confirmResult = await apiCall(
    'POST',
    `/subscriptions/${subscriptionId}/actions/confirm`,
    { startDate: new Date().toISOString() },
    internalToken
  );
  assert(confirmResult.ok, 'Can transition to CONFIRMED');
  assert(confirmResult.data.subscription.status === 'CONFIRMED', 'Status is CONFIRMED');

  // CONFIRMED -> ACTIVE
  const activateResult = await apiCall(
    'POST',
    `/subscriptions/${subscriptionId}/actions/activate`,
    {},
    internalToken
  );
  assert(activateResult.ok, 'Can transition to ACTIVE');
  assert(activateResult.data.subscription.status === 'ACTIVE', 'Status is ACTIVE');

  // Test 8: Generate invoice (idempotent)
  console.log('\nTest 8: Generate invoice (idempotent)');
  const periodStart = new Date().toISOString();
  const invoice1 = await apiCall(
    'POST',
    `/subscriptions/${subscriptionId}/invoices/generate?periodStart=${periodStart}`,
    {},
    internalToken
  );
  assert(invoice1.ok, 'Can generate invoice');
  assert(invoice1.data.invoice.status === 'DRAFT', 'Invoice status is DRAFT');

  const invoiceId = invoice1.data.invoice.id;

  // Test idempotency
  const invoice2 = await apiCall(
    'POST',
    `/subscriptions/${subscriptionId}/invoices/generate?periodStart=${periodStart}`,
    {},
    internalToken
  );
  assert(invoice2.ok, 'Second generation succeeds (idempotent)');
  assert(invoice2.data.invoice.id === invoiceId, 'Returns same invoice (idempotent)');

  // Test 9: Confirm invoice
  console.log('\nTest 9: Confirm invoice');
  const confirmInvoice = await apiCall(
    'POST',
    `/invoices/${invoiceId}/actions/confirm`,
    {},
    internalToken
  );
  assert(confirmInvoice.ok, 'Can confirm invoice');
  assert(confirmInvoice.data.invoice.status === 'CONFIRMED', 'Invoice is CONFIRMED');

  // Test 10: Record payment
  console.log('\nTest 10: Record payment');
  const invoiceDetails = await apiCall('GET', `/invoices/${invoiceId}`, undefined, internalToken);
  const totalAmount = parseFloat(invoiceDetails.data.invoice.total);

  const payment = await apiCall(
    'POST',
    `/invoices/${invoiceId}/payments`,
    {
      amount: totalAmount,
      paymentMethod: 'BANK_TRANSFER',
      reference: 'TEST-PAYMENT-001',
    },
    internalToken
  );
  assert(payment.ok, 'Can record payment');

  // Verify invoice is marked as PAID
  const paidInvoice = await apiCall('GET', `/invoices/${invoiceId}`, undefined, internalToken);
  assert(paidInvoice.data.invoice.status === 'PAID', 'Invoice automatically marked as PAID');

  // Test 11: Reports
  console.log('\nTest 11: Generate reports');
  const report = await apiCall('GET', '/reports/summary', undefined, adminToken);
  assert(report.ok, 'Can generate summary report');
  assert(typeof report.data.summary.activeSubscriptionsCount === 'number', 'Report has active subs count');
  assert(typeof report.data.summary.totalRevenue === 'number', 'Report has revenue total');

  // Test 12: Portal user access control
  console.log('\nTest 12: Portal user access control');
  const portalSubs = await apiCall('GET', '/subscriptions', undefined, portalToken);
  assert(portalSubs.ok, 'Portal user can list subscriptions');
  
  // Portal user should not be able to create subscriptions
  const createSubAsPortal = await apiCall(
    'POST',
    '/subscriptions',
    { userId: portalLogin.data.user.id, planId: subscriptions.data.items[0].planId },
    portalToken
  );
  assert(!createSubAsPortal.ok && createSubAsPortal.status === 403, 'Portal user cannot create subscriptions');

  console.log('\n🎉 All smoke tests passed!');
  console.log('✨ System is functioning correctly\n');
}

main()
  .catch((e) => {
    console.error('\n💥 Smoke test failed:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
