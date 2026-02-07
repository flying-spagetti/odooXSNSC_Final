/**
 * Razorpay Service
 * Handles Razorpay payment gateway integration
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, BusinessRuleError } from '../domain/errors';
import { PaymentService } from './payment.service';

export interface CreateOrderData {
  amount: number; // Amount in rupees
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class RazorpayService {
  private razorpay: Razorpay;
  private paymentService: PaymentService;

  constructor(private prisma: PrismaClient) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    this.paymentService = new PaymentService(prisma);
  }

  /**
   * Create a Razorpay order
   * Amount should be in paise (multiply rupees by 100)
   */
  async createOrder(data: CreateOrderData) {
    try {
      const orderData = {
        amount: Math.round(data.amount * 100), // Convert to paise
        currency: data.currency || 'INR',
        receipt: data.receipt || `receipt_${Date.now()}`,
        notes: data.notes || {},
      };

      const order = await this.razorpay.orders.create(orderData);
      return order;
    } catch (error: any) {
      throw new BusinessRuleError(`Failed to create Razorpay order: ${error.message}`);
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(data: VerifyPaymentData): boolean {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      throw new Error('Razorpay key secret not configured');
    }

    // Create signature
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Compare signatures
    return generatedSignature === razorpay_signature;
  }

  /**
   * Capture payment and record in database
   * This should be called after payment verification
   */
  async capturePayment(
    invoiceId: string,
    paymentData: VerifyPaymentData,
    actorUserId: string
  ) {
    // Verify signature first
    if (!this.verifyPaymentSignature(paymentData)) {
      throw new BusinessRuleError('Invalid payment signature');
    }

    // Get payment details from Razorpay
    try {
      const payment = await this.razorpay.payments.fetch(paymentData.razorpay_payment_id);
      
      // Convert amount from paise to rupees
      const amount = payment.amount / 100;

      // Record payment in database
      const recordedPayment = await this.paymentService.recordPayment(
        invoiceId,
        {
          amount,
          paymentMethod: 'CREDIT_CARD', // Razorpay typically uses card/UPI
          reference: paymentData.razorpay_payment_id,
          notes: `Razorpay Order: ${paymentData.razorpay_order_id}`,
          paymentDate: new Date(payment.created_at * 1000), // Razorpay uses Unix timestamp
        },
        actorUserId
      );

      return {
        payment: recordedPayment,
        razorpayPayment: payment,
      };
    } catch (error: any) {
      throw new BusinessRuleError(`Failed to capture payment: ${error.message}`);
    }
  }

  /**
   * Get payment details from Razorpay
   */
  async getPaymentDetails(paymentId: string) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error: any) {
      throw new NotFoundError('RazorpayPayment', paymentId);
    }
  }

  /**
   * Get order details from Razorpay
   */
  async getOrderDetails(orderId: string) {
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      return order;
    } catch (error: any) {
      throw new NotFoundError('RazorpayOrder', orderId);
    }
  }
}
