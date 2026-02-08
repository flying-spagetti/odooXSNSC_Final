import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Flex, VStack, Table, Thead, Tbody, Tr, Th, Td, Divider } from '@chakra-ui/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { subscriptionApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SubscriptionPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => subscriptionApi.get(id!),
    enabled: !!id,
  });

  const subscription = data?.data.subscription;

  if (isLoading) {
    return (
      <Box className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading preview...</p>
      </Box>
    );
  }

  if (!subscription) {
    return (
      <Box className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Subscription not found</p>
      </Box>
    );
  }

  // --- Calculation helpers ---
  const calculateLineTotal = (line: any) => {
    let subtotal = line.quantity * parseFloat(line.unitPrice);
    let discount = 0;
    if (line.discount) {
      if (line.discount.type === 'PERCENTAGE') {
        discount = subtotal * (parseFloat(line.discount.value) / 100);
      } else {
        discount = parseFloat(line.discount.value);
      }
    }
    const afterDiscount = subtotal - discount;
    const tax = line.taxRate ? afterDiscount * (parseFloat(line.taxRate.rate) / 100) : 0;
    return afterDiscount + tax;
  };

  const calculateLineDiscount = (line: any) => {
    if (!line.discount) return 0;
    const subtotal = line.quantity * parseFloat(line.unitPrice);
    if (line.discount.type === 'PERCENTAGE') {
      return subtotal * (parseFloat(line.discount.value) / 100);
    }
    return parseFloat(line.discount.value);
  };

  const calculateLineTax = (line: any) => {
    if (!line.taxRate) return 0;
    const subtotal = line.quantity * parseFloat(line.unitPrice);
    const discount = calculateLineDiscount(line);
    return (subtotal - discount) * (parseFloat(line.taxRate.rate) / 100);
  };

  const lines = subscription.lines || [];
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  lines.forEach((line: any) => {
    subtotal += line.quantity * parseFloat(line.unitPrice);
    totalDiscount += calculateLineDiscount(line);
    totalTax += calculateLineTax(line);
  });
  const total = subtotal - totalDiscount + totalTax;

  const statusLabel: Record<string, string> = {
    DRAFT: 'Draft',
    QUOTATION: 'Quotation',
    CONFIRMED: 'Confirmed',
    ACTIVE: 'Active',
    CLOSED: 'Closed',
  };

  return (
    <Box className="min-h-screen bg-gray-50">
      {/* Top bar (hidden in print) */}
      <Flex
        justify="space-between"
        align="center"
        className="p-4 bg-white border-b shadow-sm print:hidden"
      >
        <Flex align="center" gap={3}>
          <Button variant="outline" size="sm" onClick={() => navigate(`/subscriptions/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
          <span className="text-sm text-muted-foreground">Portal Preview</span>
        </Flex>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </Flex>

      {/* Preview content */}
      <Box className="max-w-4xl mx-auto p-8 my-8 bg-white rounded-lg shadow-md print:shadow-none print:my-0 print:rounded-none">
        {/* Header */}
        <Flex justify="space-between" align="flex-start" className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {subscription.status === 'QUOTATION' || subscription.status === 'DRAFT'
                ? 'Quotation'
                : 'Subscription Order'}
            </h1>
            <p className="text-lg text-gray-600 mt-1">{subscription.subscriptionNumber}</p>
          </div>
          <Badge
            variant="outline"
            className="text-sm px-3 py-1"
          >
            {statusLabel[subscription.status] || subscription.status}
          </Badge>
        </Flex>

        <Divider className="mb-6" />

        {/* Customer & Order Details */}
        <Flex justify="space-between" className="mb-8" gap={8} wrap="wrap">
          <VStack align="flex-start" spacing={1}>
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Customer</p>
            <p className="text-lg font-semibold text-gray-900">{subscription.user?.name || '-'}</p>
            <p className="text-sm text-gray-600">{subscription.user?.email}</p>
          </VStack>

          <VStack align="flex-end" spacing={3}>
            {subscription.orderDate && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Order Date</p>
                <p className="text-sm font-medium">{new Date(subscription.orderDate).toLocaleDateString()}</p>
              </div>
            )}
            {subscription.expirationDate && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Expiration</p>
                <p className="text-sm font-medium">{new Date(subscription.expirationDate).toLocaleDateString()}</p>
              </div>
            )}
            {subscription.plan && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Recurring Plan</p>
                <p className="text-sm font-medium">
                  {subscription.plan.name} ({subscription.plan.billingPeriod} / every {subscription.plan.intervalCount})
                </p>
              </div>
            )}
            {subscription.paymentTermDays && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Payment Terms</p>
                <p className="text-sm font-medium">{subscription.paymentTermDays} days</p>
              </div>
            )}
            {subscription.nextBillingDate && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Next Invoice</p>
                <p className="text-sm font-medium">{new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
              </div>
            )}
          </VStack>
        </Flex>

        {/* Order Lines */}
        {lines.length > 0 && (
          <Box className="border rounded-lg overflow-hidden mb-6">
            <Table size="sm">
              <Thead>
                <Tr className="bg-gray-50">
                  <Th className="py-3">Product</Th>
                  <Th isNumeric className="py-3">Qty</Th>
                  <Th isNumeric className="py-3">Unit Price</Th>
                  <Th isNumeric className="py-3">Discount</Th>
                  <Th isNumeric className="py-3">Tax</Th>
                  <Th isNumeric className="py-3">Amount</Th>
                </Tr>
              </Thead>
              <Tbody>
                {lines.map((line: any) => (
                  <Tr key={line.id}>
                    <Td className="py-3">
                      <p className="font-medium text-gray-900">
                        {line.variant?.product?.name}
                      </p>
                      {line.variant?.name && (
                        <p className="text-xs text-gray-500">{line.variant.name}</p>
                      )}
                    </Td>
                    <Td isNumeric className="py-3">{line.quantity}</Td>
                    <Td isNumeric className="py-3">₹{parseFloat(line.unitPrice).toFixed(2)}</Td>
                    <Td isNumeric className="py-3">
                      {line.discount
                        ? line.discount.type === 'PERCENTAGE'
                          ? `${parseFloat(line.discount.value).toFixed(0)}%`
                          : `₹${parseFloat(line.discount.value).toFixed(2)}`
                        : '-'}
                    </Td>
                    <Td isNumeric className="py-3">
                      {line.taxRate
                        ? `${parseFloat(line.taxRate.rate).toFixed(0)}%`
                        : '-'}
                    </Td>
                    <Td isNumeric className="py-3 font-semibold">
                      ₹{calculateLineTotal(line).toFixed(2)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        {/* Totals */}
        <Flex justify="flex-end">
          <Box className="w-72 space-y-2">
            <Flex justify="space-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </Flex>
            {totalDiscount > 0 && (
              <Flex justify="space-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-green-600">-₹{totalDiscount.toFixed(2)}</span>
              </Flex>
            )}
            {totalTax > 0 && (
              <Flex justify="space-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">₹{totalTax.toFixed(2)}</span>
              </Flex>
            )}
            <Divider />
            <Flex justify="space-between" className="pt-1">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">₹{total.toFixed(2)}</span>
            </Flex>
          </Box>
        </Flex>

        {/* Notes */}
        {subscription.notes && (
          <Box className="mt-8 pt-6 border-t">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Notes</p>
            <p className="text-sm text-gray-700">{subscription.notes}</p>
          </Box>
        )}

        {/* Footer */}
        <Box className="mt-12 pt-6 border-t text-center">
          <p className="text-xs text-gray-400">
            Generated on {new Date().toLocaleDateString()} • {subscription.subscriptionNumber}
          </p>
        </Box>
      </Box>
    </Box>
  );
}
