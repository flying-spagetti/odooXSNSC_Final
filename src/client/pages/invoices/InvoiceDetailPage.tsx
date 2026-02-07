import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Flex, SimpleGrid, VStack, useDisclosure, useToast } from '@chakra-ui/react';
import { ArrowLeft, AlertCircle, DollarSign } from 'lucide-react';
import { invoiceApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { FormDialog } from '@/components/FormDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PaymentForm } from './components/PaymentForm';
import { Badge } from '@/components/ui/badge';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const { isOpen: isPaymentOpen, onOpen: onPaymentOpen, onClose: onPaymentClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceApi.get(id!),
    enabled: !!id,
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['invoice-payments', id],
    queryFn: () => invoiceApi.listPayments(id!),
    enabled: !!id,
  });

  const confirmMutation = useMutation({
    mutationFn: () => invoiceApi.confirm(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Invoice confirmed',
        status: 'success',
        duration: 3000,
      });
      onConfirmClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to confirm invoice',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => invoiceApi.cancel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Invoice canceled',
        status: 'success',
        duration: 3000,
      });
      onCancelClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel invoice',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => invoiceApi.recordPayment(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoice-payments', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Payment recorded',
        description: 'Payment has been recorded successfully',
        status: 'success',
        duration: 5000,
      });
      onPaymentClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to record payment',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const invoice = data?.data.invoice;
  const payments = paymentsData?.data.payments || [];

  if (isLoading) {
    return (
      <Box>
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box>
        <p className="text-center text-muted-foreground py-12">Invoice not found</p>
      </Box>
    );
  }

  const total = parseFloat(invoice.total);
  const paidAmount = parseFloat(invoice.paidAmount);
  const balanceDue = total - paidAmount;
  const isOverdue = invoice.status !== 'PAID' && invoice.status !== 'CANCELED' && new Date(invoice.dueDate) < new Date();

  const handleRecordPayment = (data: any) => {
    recordPaymentMutation.mutate(data);
  };

  return (
    <Box>
      <Flex align="center" gap={4} className="mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <Flex align="center" gap={3}>
            <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
            <StatusBadge status={invoice.status} type="invoice" />
            {isOverdue && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </Flex>
          <p className="text-muted-foreground">
            Issued {new Date(invoice.issueDate).toLocaleDateString()} • Due {new Date(invoice.dueDate).toLocaleDateString()}
          </p>
        </div>
      </Flex>

      {isOverdue && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <Flex align="center" gap={2}>
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">
                This invoice is overdue. Payment was due on {new Date(invoice.dueDate).toLocaleDateString()}.
              </p>
            </Flex>
          </CardContent>
        </Card>
      )}

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${total.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${balanceDue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} className="mb-6">
        {/* Customer & Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer & Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <VStack spacing={4} align="stretch">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{invoice.subscription?.user?.name || '-'}</p>
                <p className="text-sm text-muted-foreground">{invoice.subscription?.user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscription</p>
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium"
                  onClick={() => navigate(`/subscriptions/${invoice.subscriptionId}`)}
                >
                  {invoice.subscription?.subscriptionNumber || invoice.subscriptionId}
                </Button>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billing Period</p>
                <p className="font-medium">
                  {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                </p>
              </div>
            </VStack>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Manage invoice status and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <VStack spacing={3} align="stretch">
              {invoice.status === 'DRAFT' && (
                <>
                  <Button onClick={onConfirmOpen} className="w-full">
                    Confirm Invoice
                  </Button>
                  <Button variant="outline" onClick={onCancelOpen} className="w-full">
                    Cancel Invoice
                  </Button>
                </>
              )}

              {invoice.status === 'CONFIRMED' && balanceDue > 0 && (
                <>
                  <Button onClick={onPaymentOpen} className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                  <Button variant="outline" onClick={onCancelOpen} className="w-full">
                    Cancel Invoice
                  </Button>
                </>
              )}

              {invoice.status === 'PAID' && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  This invoice has been paid in full.
                </p>
              )}

              {invoice.status === 'CANCELED' && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  This invoice has been canceled.
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
          <CardDescription>{invoice.lines?.length || 0} items</CardDescription>
        </CardHeader>
        <CardContent>
          {invoice.lines && invoice.lines.length > 0 ? (
            <VStack spacing={3} align="stretch">
              {invoice.lines.map((line: any) => (
                <Flex key={line.id} justify="space-between" className="pb-3 border-b last:border-0">
                  <Box flex={1}>
                    <p className="font-medium">{line.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {line.quantity} × ${parseFloat(line.unitPrice).toFixed(2)}
                      {parseFloat(line.discountAmount) > 0 && ` | Discount: -$${parseFloat(line.discountAmount).toFixed(2)}`}
                      {parseFloat(line.taxAmount) > 0 && ` | Tax: $${parseFloat(line.taxAmount).toFixed(2)}`}
                    </p>
                  </Box>
                  <p className="font-semibold">${parseFloat(line.lineTotal).toFixed(2)}</p>
                </Flex>
              ))}
              
              <Box className="pt-4 border-t space-y-2">
                <Flex justify="space-between">
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="font-medium">${parseFloat(invoice.subtotal).toFixed(2)}</p>
                </Flex>
                {parseFloat(invoice.discountAmount) > 0 && (
                  <Flex justify="space-between">
                    <p className="text-muted-foreground">Total Discount</p>
                    <p className="font-medium text-green-600">-${parseFloat(invoice.discountAmount).toFixed(2)}</p>
                  </Flex>
                )}
                {parseFloat(invoice.taxAmount) > 0 && (
                  <Flex justify="space-between">
                    <p className="text-muted-foreground">Total Tax</p>
                    <p className="font-medium">${parseFloat(invoice.taxAmount).toFixed(2)}</p>
                  </Flex>
                )}
                <Flex justify="space-between" className="pt-2 border-t">
                  <p className="text-xl font-bold">Total</p>
                  <p className="text-xl font-bold text-primary">${total.toFixed(2)}</p>
                </Flex>
              </Box>
            </VStack>
          ) : (
            <p className="text-center text-muted-foreground py-8">No line items</p>
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>{payments.length} payment(s) recorded</CardDescription>
          </CardHeader>
          <CardContent>
            <VStack spacing={3} align="stretch">
              {payments.map((payment: any) => (
                <Flex key={payment.id} justify="space-between" align="center" className="p-3 border rounded-md">
                  <Box>
                    <p className="font-medium">{payment.paymentMethod.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                      {payment.reference && ` | Ref: ${payment.reference}`}
                    </p>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                    )}
                  </Box>
                  <p className="font-semibold text-green-600">${parseFloat(payment.amount).toFixed(2)}</p>
                </Flex>
              ))}
            </VStack>
          </CardContent>
        </Card>
      )}

      {/* Record Payment Dialog */}
      <FormDialog
        isOpen={isPaymentOpen}
        onClose={onPaymentClose}
        title="Record Payment"
        hideFooter
      >
        <PaymentForm
          balanceDue={balanceDue}
          onSubmit={handleRecordPayment}
          isLoading={recordPaymentMutation.isPending}
        />
        <Flex justify="flex-end" gap={2} className="mt-4">
          <Button variant="outline" onClick={onPaymentClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const form = document.querySelector('form');
              form?.requestSubmit();
            }}
            disabled={recordPaymentMutation.isPending}
          >
            {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
          </Button>
        </Flex>
      </FormDialog>

      {/* Confirm Invoice Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={onConfirmClose}
        onConfirm={() => confirmMutation.mutate()}
        title="Confirm Invoice"
        message="Are you sure you want to confirm this invoice? Once confirmed, it will be ready for payment."
        confirmText="Confirm"
        isLoading={confirmMutation.isPending}
      />

      {/* Cancel Invoice Dialog */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={onCancelClose}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel Invoice"
        message="Are you sure you want to cancel this invoice? This action cannot be undone."
        confirmText="Cancel Invoice"
        variant="destructive"
        isLoading={cancelMutation.isPending}
      />
    </Box>
  );
}
