import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Flex, SimpleGrid, VStack, useDisclosure, useToast } from '@chakra-ui/react';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { subscriptionApi, Subscription } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { FormDialog } from '@/components/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const { isOpen: isInvoiceOpen, onOpen: onInvoiceOpen, onClose: onInvoiceClose } = useDisclosure();
  const [startDate, setStartDate] = useState('');
  const [periodStart, setPeriodStart] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => subscriptionApi.get(id!),
    enabled: !!id,
  });

  const quoteMutation = useMutation({
    mutationFn: () => subscriptionApi.quote(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast({
        title: 'Status updated',
        description: 'Subscription moved to Quotation status',
        status: 'success',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update status',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (startDate?: string) => subscriptionApi.confirm(id!, startDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast({
        title: 'Status updated',
        description: 'Subscription confirmed successfully',
        status: 'success',
        duration: 3000,
      });
      onConfirmClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to confirm subscription',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => subscriptionApi.activate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast({
        title: 'Status updated',
        description: 'Subscription activated successfully',
        status: 'success',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to activate subscription',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => subscriptionApi.close(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast({
        title: 'Status updated',
        description: 'Subscription closed',
        status: 'success',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to close subscription',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: (periodStart: string) => subscriptionApi.generateInvoice(id!, periodStart),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Invoice generated',
        description: `Invoice ${response.data.invoice.invoiceNumber} has been created`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onInvoiceClose();
      // Navigate to invoice
      navigate(`/invoices/${response.data.invoice.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate invoice',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const subscription = data?.data.subscription;

  if (isLoading) {
    return (
      <Box>
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      </Box>
    );
  }

  if (!subscription) {
    return (
      <Box>
        <p className="text-center text-muted-foreground py-12">Subscription not found</p>
      </Box>
    );
  }

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

  const calculateTotals = () => {
    const lines = subscription.lines || [];
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    lines.forEach((line: any) => {
      const lineSubtotal = line.quantity * parseFloat(line.unitPrice);
      subtotal += lineSubtotal;

      if (line.discount) {
        if (line.discount.type === 'PERCENTAGE') {
          totalDiscount += lineSubtotal * (parseFloat(line.discount.value) / 100);
        } else {
          totalDiscount += parseFloat(line.discount.value);
        }
      }

      if (line.taxRate) {
        const afterDiscount = lineSubtotal - (line.discount ? (line.discount.type === 'PERCENTAGE' ? lineSubtotal * (parseFloat(line.discount.value) / 100) : parseFloat(line.discount.value)) : 0);
        totalTax += afterDiscount * (parseFloat(line.taxRate.rate) / 100);
      }
    });

    return {
      subtotal,
      discount: totalDiscount,
      tax: totalTax,
      total: subtotal - totalDiscount + totalTax,
    };
  };

  const totals = calculateTotals();

  const handleConfirm = () => {
    confirmMutation.mutate(startDate || undefined);
  };

  const handleGenerateInvoice = () => {
    if (!periodStart) {
      toast({
        title: 'Validation error',
        description: 'Please select a period start date',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    generateInvoiceMutation.mutate(periodStart);
  };

  // Set default period start to next billing date or today
  const defaultPeriodStart = subscription.nextBillingDate 
    ? new Date(subscription.nextBillingDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  if (!periodStart && isInvoiceOpen) {
    setPeriodStart(defaultPeriodStart);
  }

  return (
    <Box>
      <Flex align="center" gap={4} className="mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate('/subscriptions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <Flex align="center" gap={3}>
            <h1 className="text-3xl font-bold">{subscription.subscriptionNumber}</h1>
            <StatusBadge status={subscription.status} type="subscription" />
          </Flex>
          <p className="text-muted-foreground">
            Created {new Date(subscription.createdAt).toLocaleDateString()}
          </p>
        </div>
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} className="mb-6">
        {/* Customer & Plan Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer & Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <VStack spacing={4} align="stretch">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{subscription.user?.name}</p>
                <p className="text-sm text-muted-foreground">{subscription.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{subscription.plan?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.plan?.billingPeriod} (every {subscription.plan?.intervalCount})
                </p>
              </div>
              {subscription.startDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{new Date(subscription.startDate).toLocaleDateString()}</p>
                </div>
              )}
              {subscription.nextBillingDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Next Billing Date</p>
                  <p className="font-medium">{new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
                </div>
              )}
            </VStack>
          </CardContent>
        </Card>

        {/* Status Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Manage subscription lifecycle</CardDescription>
          </CardHeader>
          <CardContent>
            <VStack spacing={3} align="stretch">
              {subscription.status === 'DRAFT' && (
                <Button
                  onClick={() => quoteMutation.mutate()}
                  disabled={quoteMutation.isPending}
                  className="w-full"
                >
                  {quoteMutation.isPending ? 'Processing...' : 'Send Quote'}
                </Button>
              )}

              {subscription.status === 'QUOTATION' && (
                <Button
                  onClick={onConfirmOpen}
                  disabled={confirmMutation.isPending}
                  className="w-full"
                >
                  Confirm Subscription
                </Button>
              )}

              {subscription.status === 'CONFIRMED' && (
                <Button
                  onClick={() => activateMutation.mutate()}
                  disabled={activateMutation.isPending}
                  className="w-full"
                >
                  {activateMutation.isPending ? 'Processing...' : 'Activate'}
                </Button>
              )}

              {subscription.status === 'ACTIVE' && (
                <>
                  <Button
                    onClick={onInvoiceOpen}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Invoice
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => closeMutation.mutate()}
                    disabled={closeMutation.isPending}
                    className="w-full"
                  >
                    {closeMutation.isPending ? 'Processing...' : 'Close Subscription'}
                  </Button>
                </>
              )}

              {subscription.status === 'CLOSED' && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  This subscription is closed. No actions available.
                </p>
              )}
            </VStack>
          </CardContent>
        </Card>
      </SimpleGrid>

      {/* Line Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
          <CardDescription>{subscription.lines?.length || 0} items in this subscription</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription.lines && subscription.lines.length > 0 ? (
            <VStack spacing={3} align="stretch">
              {subscription.lines.map((line: any) => (
                <Flex key={line.id} justify="space-between" className="p-3 border rounded-md">
                  <Box flex={1}>
                    <p className="font-medium">
                      {line.variant?.product?.name} - {line.variant?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {line.quantity} × ${parseFloat(line.unitPrice).toFixed(2)}
                      {line.taxRate && ` | Tax: ${line.taxRate.name} (${parseFloat(line.taxRate.rate).toFixed(0)}%)`}
                      {line.discount && ` | Discount: ${line.discount.name}`}
                    </p>
                  </Box>
                  <p className="font-semibold">${calculateLineTotal(line).toFixed(2)}</p>
                </Flex>
              ))}
              
              <Box className="pt-4 border-t space-y-2">
                <Flex justify="space-between">
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="font-medium">${totals.subtotal.toFixed(2)}</p>
                </Flex>
                {totals.discount > 0 && (
                  <Flex justify="space-between">
                    <p className="text-muted-foreground">Discount</p>
                    <p className="font-medium text-green-600">-${totals.discount.toFixed(2)}</p>
                  </Flex>
                )}
                {totals.tax > 0 && (
                  <Flex justify="space-between">
                    <p className="text-muted-foreground">Tax</p>
                    <p className="font-medium">${totals.tax.toFixed(2)}</p>
                  </Flex>
                )}
                <Flex justify="space-between" className="pt-2 border-t">
                  <p className="text-lg font-bold">Total</p>
                  <p className="text-lg font-bold text-primary">${totals.total.toFixed(2)}</p>
                </Flex>
              </Box>
            </VStack>
          ) : (
            <p className="text-center text-muted-foreground py-8">No line items</p>
          )}
        </CardContent>
      </Card>

      {/* Related Invoices */}
      {subscription.invoices && subscription.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Related Invoices</CardTitle>
            <CardDescription>{subscription.invoices.length} invoices generated</CardDescription>
          </CardHeader>
          <CardContent>
            <VStack spacing={3} align="stretch">
              {subscription.invoices.map((invoice: any) => (
                <Flex
                  key={invoice.id}
                  justify="space-between"
                  align="center"
                  className="p-3 border rounded-md cursor-pointer hover:bg-accent"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <Box>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </Box>
                  <Flex align="center" gap={3}>
                    <p className="font-semibold">${parseFloat(invoice.total).toFixed(2)}</p>
                    <StatusBadge status={invoice.status} type="invoice" />
                  </Flex>
                </Flex>
              ))}
            </VStack>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <FormDialog
        isOpen={isConfirmOpen}
        onClose={onConfirmClose}
        title="Confirm Subscription"
        hideFooter
      >
        <VStack spacing={4} align="stretch">
          <div>
            <Label htmlFor="startDate">Start Date (Optional)</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use current date
            </p>
          </div>
          <Flex justify="flex-end" gap={2}>
            <Button variant="outline" onClick={onConfirmClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={confirmMutation.isPending}>
              {confirmMutation.isPending ? 'Confirming...' : 'Confirm'}
            </Button>
          </Flex>
        </VStack>
      </FormDialog>

      {/* Generate Invoice Dialog */}
      <FormDialog
        isOpen={isInvoiceOpen}
        onClose={onInvoiceClose}
        title="Generate Invoice"
        hideFooter
      >
        <VStack spacing={4} align="stretch">
          <div>
            <Label htmlFor="periodStart">Period Start Date *</Label>
            <Input
              id="periodStart"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Select the start date for the billing period
            </p>
          </div>
          <Flex justify="flex-end" gap={2}>
            <Button variant="outline" onClick={onInvoiceClose}>
              Cancel
            </Button>
            <Button onClick={handleGenerateInvoice} disabled={generateInvoiceMutation.isPending}>
              {generateInvoiceMutation.isPending ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </Flex>
        </VStack>
      </FormDialog>
    </Box>
  );
}
