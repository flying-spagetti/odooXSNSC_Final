/**
 * PDF Generator Utility
 * Generates PDF documents for subscriptions/orders
 */

import PDFDocument from 'pdfkit';
import { Subscription } from '@prisma/client';

export interface SubscriptionWithDetails extends Subscription {
  plan: any;
  user: any;
  lines: Array<{
    id: string;
    quantity: number;
    unitPrice: any;
    variant: any;
    discount?: any;
    taxRate?: any;
  }>;
  invoices?: any[];
}

export function generateSubscriptionPDF(subscription: SubscriptionWithDetails): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Order Details', { align: 'center' });
      doc.moveDown();

      // Order Information
      doc.fontSize(14).text(`Order Number: ${subscription.subscriptionNumber}`);
      doc.text(`Status: ${subscription.status}`);
      if (subscription.orderDate) {
        doc.text(`Order Date: ${new Date(subscription.orderDate).toLocaleDateString()}`);
      }
      doc.moveDown();

      // Customer Information
      doc.fontSize(14).text('Customer Information', { underline: true });
      doc.fontSize(12);
      doc.text(`Name: ${subscription.user?.name || 'N/A'}`);
      doc.text(`Email: ${subscription.user?.email || 'N/A'}`);
      if (subscription.user?.phone) {
        doc.text(`Phone: ${subscription.user.phone}`);
      }
      if (subscription.user?.address) {
        doc.text(`Address: ${subscription.user.address}`);
      }
      doc.moveDown();

      // Subscription Details
      doc.fontSize(14).text('Subscription Details', { underline: true });
      doc.fontSize(12);
      doc.text(`Plan: ${subscription.plan?.name || 'N/A'}`);
      if (subscription.startDate) {
        doc.text(`Start Date: ${new Date(subscription.startDate).toLocaleDateString()}`);
      }
      if (subscription.expirationDate) {
        doc.text(`End Date: ${new Date(subscription.expirationDate).toLocaleDateString()}`);
      }
      doc.moveDown();

      // Products Table
      if (subscription.lines && subscription.lines.length > 0) {
        doc.fontSize(14).text('Products', { underline: true });
        doc.moveDown(0.5);

        // Table header
        const tableTop = doc.y;
        doc.fontSize(10);
        doc.text('Product', 50, tableTop);
        doc.text('Quantity', 250, tableTop);
        doc.text('Unit Price', 320, tableTop);
        doc.text('Tax', 400, tableTop);
        doc.text('Amount', 450, tableTop);

        let y = tableTop + 20;
        let subtotal = 0;
        let totalTax = 0;

        subscription.lines.forEach((line) => {
          const unitPrice = parseFloat(line.unitPrice.toString());
          const quantity = line.quantity;
          const lineSubtotal = unitPrice * quantity;
          
          let discountAmount = 0;
          if (line.discount) {
            if (line.discount.type === 'PERCENTAGE') {
              discountAmount = lineSubtotal * (parseFloat(line.discount.value.toString()) / 100);
            } else {
              discountAmount = parseFloat(line.discount.value.toString());
            }
          }

          const afterDiscount = lineSubtotal - discountAmount;
          const taxRate = line.taxRate ? parseFloat(line.taxRate.rate.toString()) : 0;
          const taxAmount = afterDiscount * (taxRate / 100);
          const lineTotal = afterDiscount + taxAmount;

          subtotal += afterDiscount;
          totalTax += taxAmount;

          doc.text(line.variant?.name || 'Product', 50, y);
          doc.text(quantity.toString(), 250, y);
          doc.text(`₹${unitPrice.toFixed(2)}`, 320, y);
          doc.text(`${taxRate}%`, 400, y);
          doc.text(`₹${lineTotal.toFixed(2)}`, 450, y);

          y += 20;
        });

        doc.moveDown();
        y = doc.y;

        // Summary
        doc.fontSize(12);
        doc.text(`Untaxed Amount: ₹${subtotal.toFixed(2)}`, 350, y);
        y += 20;
        doc.text(`Tax: ₹${totalTax.toFixed(2)}`, 350, y);
        y += 20;
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text(`Total: ₹${(subtotal + totalTax).toFixed(2)}`, 350, y);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
