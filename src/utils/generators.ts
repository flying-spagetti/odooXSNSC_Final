/**
 * ID and Number Generators
 * Generate unique subscription numbers, invoice numbers, etc.
 */

/**
 * Generate subscription number: SUB-YYYYMMDD-XXXXX
 */
export function generateSubscriptionNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');

  return `SUB-${year}${month}${day}-${random}`;
}

/**
 * Generate invoice number: INV-YYYYMMDD-XXXXX
 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');

  return `INV-${year}${month}${day}-${random}`;
}
