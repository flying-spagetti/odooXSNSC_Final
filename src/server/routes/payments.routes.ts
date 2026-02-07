/**
 * Payments Routes
 * Razorpay payment gateway integration
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { RazorpayService } from '../services/razorpay.service';
import { InvoiceService } from '../services/invoice.service';
import { SubscriptionService } from '../services/subscription.service';
import { NotFoundError } from '../domain/errors';

const CreateOrderSchema = z.object({
  invoiceId: z.string().optional(),
  subscriptionId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().optional(),
  receipt: z.string().optional(),
  notes: z.record(z.string()).optional(),
});

const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  invoiceId: z.string(),
});

const paymentsRoutes: FastifyPluginAsync = async (fastify) => {
  const razorpayService = new RazorpayService(fastify.prisma);
  const invoiceService = new InvoiceService(fastify.prisma);
  const subscriptionService = new SubscriptionService(fastify.prisma);

  // Create Razorpay order
  fastify.post(
    '/create-order',
    {
      onRequest: [fastify.authenticate, fastify.authorize('payments:create')],
    },
    async (request, reply) => {
      const data = CreateOrderSchema.parse(request.body);

      // If invoiceId is provided, verify it exists and get amount
      let amount = data.amount;
      if (data.invoiceId) {
        const invoice = await invoiceService.getById(data.invoiceId);
        amount = parseFloat(invoice.total.toString()) - parseFloat(invoice.paidAmount.toString());
        
        if (amount <= 0) {
          throw new NotFoundError('Invoice', data.invoiceId);
        }
      }

      // If subscriptionId is provided, create invoice first if needed
      if (data.subscriptionId && !data.invoiceId) {
        let subscription = await subscriptionService.getById(data.subscriptionId);
        
        // If subscription is DRAFT, confirm it first
        if (subscription.status === 'DRAFT') {
          subscription = await subscriptionService.actionConfirm(data.subscriptionId, request.user!.userId);
        }
        
        // Generate invoice for current period if subscription is confirmed/active
        if (['CONFIRMED', 'ACTIVE'].includes(subscription.status)) {
          const periodStart = subscription.startDate || new Date();
          const invoice = await invoiceService.generateInvoiceForPeriod(
            data.subscriptionId,
            periodStart,
            request.user!.userId
          );
          
          // Confirm invoice
          if (invoice.status === 'DRAFT') {
            await invoiceService.actionConfirm(invoice.id, request.user!.userId);
          }
          
          amount = parseFloat(invoice.total.toString()) - parseFloat(invoice.paidAmount.toString());
          data.invoiceId = invoice.id;
        }
      }

      const order = await razorpayService.createOrder({
        amount,
        currency: data.currency,
        receipt: data.receipt || `receipt_${Date.now()}`,
        notes: {
          ...data.notes,
          invoiceId: data.invoiceId || '',
          subscriptionId: data.subscriptionId || '',
          userId: request.user!.userId,
        },
      });
      return {
        order,
        invoiceId: data.invoiceId,
        subscriptionId: data.subscriptionId,
        keyId: process.env.RAZORPAY_KEY_ID, // Return the key_id so frontend uses the same key that created the order
      };
    }
  );

  // Verify and capture payment
  fastify.post(
    '/verify',
    {
      onRequest: [fastify.authenticate, fastify.authorize('payments:create')],
    },
    async (request, reply) => {
      const data = VerifyPaymentSchema.parse(request.body);

      // Verify invoice exists
      const invoice = await invoiceService.getById(data.invoiceId);

      // Capture payment
      const result = await razorpayService.capturePayment(
        data.invoiceId,
        {
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
        },
        request.user!.userId
      );

      // If subscription is associated, update payment status
      if (invoice.subscriptionId) {
        const subscription = await subscriptionService.getById(invoice.subscriptionId);
        if (subscription.status === 'CONFIRMED' && !subscription.paymentDone) {
          await subscriptionService.update(
            invoice.subscriptionId,
            { paymentDone: true },
            request.user!.userId
          );
        }
      }

      return {
        success: true,
        payment: result.payment,
        invoice: await invoiceService.getById(data.invoiceId),
      };
    }
  );

  // Get payment details
  fastify.get(
    '/:paymentId',
    {
      onRequest: [fastify.authenticate, fastify.authorize('payments:read')],
    },
    async (request, reply) => {
      const params = z.object({ paymentId: z.string() }).parse(request.params);
      const payment = await razorpayService.getPaymentDetails(params.paymentId);
      return { payment };
    }
  );

  // Get order details
  fastify.get(
    '/orders/:orderId',
    {
      onRequest: [fastify.authenticate, fastify.authorize('payments:read')],
    },
    async (request, reply) => {
      const params = z.object({ orderId: z.string() }).parse(request.params);
      const order = await razorpayService.getOrderDetails(params.orderId);
      return { order };
    }
  );
};

export default paymentsRoutes;
