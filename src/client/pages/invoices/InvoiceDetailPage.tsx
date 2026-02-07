import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Flex,
  SimpleGrid,
  VStack,
  useDisclosure,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Checkbox,
} from '@chakra-ui/react';
import {
  ArrowLeft,
  AlertCircle,
  DollarSign,
  Trash2,
  Send,
  Printer,
  Check,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { invoiceApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { FormDialog } from '@/components/FormDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PaymentForm } from './components/PaymentForm';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const {
    isOpen: isPaymentOpen,
    onOpen: onPaymentOpen,
    onClose: onPaymentClose,
  } = useDisclosure();
  const {
    isOpen: isConfirmOpen,
    onOpen: onConfirmOpen,
    onClose: onConfirmClose,
  } = useDisclosure();
  const {
    isOpen: isCancelOpen,
    onOpen: onCancelOpen,
    onClose: onCancelClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

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
      toast({ title: 'Invoice confirmed', status: 'success', duration: 3000 });
      onConfirmClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to confirm invoice',
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
      toast({ title: 'Invoice canceled', status: 'success', duration: 3000 });
      onCancelClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to cancel invoice',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => invoiceApi.restore(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice restored to draft', status: 'success', duration: 3000 });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to restore invoice',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => invoiceApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice deleted', status: 'success', duration: 3000 });
      onDeleteClose();
      navigate('/invoices');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to delete invoice',
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
        description:
          error.response?.data?.message || 'Failed to record payment',
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
        <p className="text-center text-muted-foreground py-12">
          Invoice not found
        </p>
      </Box>
    );
  }

  const total = parseFloat(invoice.total);
  const paidAmount = parseFloat(invoice.paidAmount);
  const balanceDue = total - paidAmount;
  const isOverdue =
    invoice.status !== 'PAID' &&
    invoice.status !== 'CANCELED' &&
    new Date(invoice.dueDate) < new Date();
  const isPaid = invoice.status === 'PAID';

  const handleRecordPayment = (data: any) => {
    recordPaymentMutation.mutate(data);
  };

  // Status step index for badge display (Draft → confirmed)
  const getStatusStepIndex = () => {
    switch (invoice.status) {
      case 'DRAFT':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PAID':
        return 1;
      case 'CANCELED':
        return -1;
      default:
        return 0;
    }
  };
  const statusStepIndex = getStatusStepIndex();

  return (
    <Box>
      {/* Back button */}
      <Flex align="center" gap={4} className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/invoices')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Flex>

      {/* Top toolbar */}
      <Flex
        justify="space-between"
        align="center"
        className="mb-4 p-3 bg-white border rounded-lg shadow-sm"
        wrap="wrap"
        gap={2}
      >
        <Flex gap={2} wrap="wrap" align="center">
          {/* Delete icon (Draft and Confirmed) */}
          {(invoice.status === 'DRAFT' || invoice.status === 'CONFIRMED') && (
            <Button 
              size="sm" 
              variant="ghost" 
              title="Delete"
              onClick={onDeleteOpen}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          {/* DRAFT state: Delete, Confirm, Cancel */}
          {invoice.status === 'DRAFT' && (
            <>
              <Button size="sm" onClick={onConfirmOpen}>
                <Check className="h-4 w-4 mr-1" /> Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCancelOpen}
              >
                Cancel
              </Button>
            </>
          )}

          {/* CONFIRMED state: Delete, Confirm (disabled), Cancel, Subscription, Preview, Send, Pay, Print */}
          {invoice.status === 'CONFIRMED' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onConfirmOpen}
                disabled
              >
                <Check className="h-4 w-4 mr-1" /> Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCancelOpen}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate(
                    `/subscriptions/${invoice.subscriptionId}`
                  )
                }
              >
                <FileText className="h-4 w-4 mr-1" /> Subscription
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.open(`/invoices/${id}`, '_blank');
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-1 rotate-180" />{' '}
                Preview
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  toast({
                    title: 'Invoice sent',
                    description: 'Invoice has been sent to the customer',
                    status: 'success',
                    duration: 3000,
                  });
                }}
              >
                <Send className="h-4 w-4 mr-1" /> Send
              </Button>
              <Button size="sm" onClick={onPaymentOpen}>
                <DollarSign className="h-4 w-4 mr-1" /> Pay
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
            </>
          )}

          {/* CANCELED state: Restore to draft */}
          {invoice.status === 'CANCELED' && (
            <Button
              size="sm"
              onClick={() => restoreMutation.mutate()}
              disabled={restoreMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Restore to Draft
            </Button>
          )}

          {/* PAID state actions */}
          {invoice.status === 'PAID' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate(
                    `/subscriptions/${invoice.subscriptionId}`
                  )
                }
              >
                <FileText className="h-4 w-4 mr-1" /> Subscription
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
            </>
          )}
        </Flex>

        {/* Status badges: Draft → confirmed */}
        <Flex gap={2} align="center">
          <Badge
            variant={statusStepIndex >= 0 ? 'default' : 'outline'}
            className={
              statusStepIndex >= 1
                ? 'bg-primary text-primary-foreground'
                : statusStepIndex === 0
                ? 'border-primary text-primary border-dashed border-2'
                : ''
            }
          >
            Draft
          </Badge>
          <Badge
            variant={statusStepIndex >= 1 ? 'default' : 'outline'}
            className={
              statusStepIndex >= 1
                ? 'bg-primary text-primary-foreground'
                : ''
            }
          >
            confirmed
          </Badge>
          {invoice.status === 'CANCELED' && (
            <Badge variant="destructive">Canceled</Badge>
          )}
        </Flex>
      </Flex>

      {/* Overdue warning */}
      {isOverdue && (
        <Box className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Flex align="center" gap={2}>
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">
              This invoice is overdue. Payment was due on{' '}
              {new Date(invoice.dueDate).toLocaleDateString()}.
            </p>
          </Flex>
        </Box>
      )}

      {/* Invoice details card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">{invoice.invoiceNumber}</h2>
          </div>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {/* Left column */}
            <VStack spacing={4} align="stretch">
              <div>
                <Flex align="center" gap={4}>
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Customer
                    </Label>
                    <p className="font-medium text-lg">
                      {invoice.subscription?.user?.name || '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.subscription?.user?.email || '-'}
                    </p>
                  </div>
                  {/* Paid checkbox - only show in CONFIRMED state */}
                  {invoice.status === 'CONFIRMED' && (
                    <Flex align="center" gap={2}>
                      <Label className="text-sm font-semibold text-muted-foreground">
                        paid
                      </Label>
                      <Checkbox
                        isChecked={isPaid}
                        isDisabled
                        size="lg"
                      />
                    </Flex>
                  )}
                </Flex>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Invoice Date
                </Label>
                <p className="font-medium">
                  {new Date(invoice.issueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Due Date
                </Label>
                <p
                  className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}
                >
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            </VStack>

            {/* Right column */}
            <VStack spacing={4} align="stretch">
              <Flex align="center" gap={4}>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">
                    Paid
                  </Label>
                </div>
                <Checkbox
                  isChecked={isPaid}
                  isDisabled
                  size="lg"
                />
              </Flex>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Subscription
                </Label>
                <p
                  className="font-medium text-primary cursor-pointer hover:underline"
                  onClick={() =>
                    navigate(
                      `/subscriptions/${invoice.subscriptionId}`
                    )
                  }
                >
                  {invoice.subscription?.subscriptionNumber ||
                    invoice.subscriptionId}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Billing Period
                </Label>
                <p className="font-medium">
                  {new Date(invoice.periodStart).toLocaleDateString()}{' '}
                  -{' '}
                  {new Date(invoice.periodEnd).toLocaleDateString()}
                </p>
              </div>
            </VStack>
          </SimpleGrid>
        </CardContent>
      </Card>

      {/* Tabs: Order Lines | Other Info */}
      <Card className="mb-6">
        <Tabs>
          <TabList className="px-4">
            <Tab fontWeight="semibold">Order Lines</Tab>
            <Tab fontWeight="semibold">Other Info</Tab>
          </TabList>

          <TabPanels>
            {/* Order Lines Tab */}
            <TabPanel p={0}>
              {invoice.lines && invoice.lines.length > 0 ? (
                <Box className="overflow-x-auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Product</Th>
                        <Th isNumeric>Quantity</Th>
                        <Th isNumeric>Unit Price</Th>
                        <Th isNumeric>Taxes</Th>
                        <Th isNumeric>Amount</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {invoice.lines.map((line: any) => (
                        <Tr key={line.id}>
                          <Td>
                            <span className="font-medium">
                              {line.description}
                            </span>
                          </Td>
                          <Td isNumeric>{line.quantity}</Td>
                          <Td isNumeric>
                            ${parseFloat(line.unitPrice).toFixed(2)}
                          </Td>
                          <Td isNumeric>
                            {parseFloat(line.taxAmount) > 0
                              ? `$${parseFloat(line.taxAmount).toFixed(2)}`
                              : '-'}
                          </Td>
                          <Td isNumeric className="font-semibold">
                            $
                            {parseFloat(line.lineTotal).toFixed(2)}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>

                  {/* Totals */}
                  <Box className="p-4 border-t space-y-2">
                    <Flex justify="flex-end" gap={8}>
                      <span className="text-muted-foreground">
                        Subtotal
                      </span>
                      <span className="font-medium w-24 text-right">
                        ${parseFloat(invoice.subtotal).toFixed(2)}
                      </span>
                    </Flex>
                    {parseFloat(invoice.discountAmount) > 0 && (
                      <Flex justify="flex-end" gap={8}>
                        <span className="text-muted-foreground">
                          Discount
                        </span>
                        <span className="font-medium text-green-600 w-24 text-right">
                          -$
                          {parseFloat(
                            invoice.discountAmount
                          ).toFixed(2)}
                        </span>
                      </Flex>
                    )}
                    {parseFloat(invoice.taxAmount) > 0 && (
                      <Flex justify="flex-end" gap={8}>
                        <span className="text-muted-foreground">
                          Tax
                        </span>
                        <span className="font-medium w-24 text-right">
                          $
                          {parseFloat(invoice.taxAmount).toFixed(2)}
                        </span>
                      </Flex>
                    )}
                    <Flex
                      justify="flex-end"
                      gap={8}
                      className="pt-2 border-t"
                    >
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-lg font-bold text-primary w-24 text-right">
                        ${total.toFixed(2)}
                      </span>
                    </Flex>
                  </Box>
                </Box>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No line items
                </p>
              )}
            </TabPanel>

            {/* Other Info Tab */}
            <TabPanel>
              <SimpleGrid
                columns={{ base: 1, md: 2 }}
                spacing={6}
                className="p-2"
              >
                <VStack spacing={4} align="stretch">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Total Amount
                    </Label>
                    <p className="text-2xl font-bold">
                      ${total.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Paid Amount
                    </Label>
                    <p className="text-2xl font-bold text-green-600">
                      ${paidAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Balance Due
                    </Label>
                    <p
                      className={`text-2xl font-bold ${
                        balanceDue > 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      ${balanceDue.toFixed(2)}
                    </p>
                  </div>
                </VStack>

                <VStack spacing={4} align="stretch">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Status
                    </Label>
                    <Flex align="center" gap={2} className="mt-1">
                      <StatusBadge
                        status={invoice.status}
                        type="invoice"
                      />
                      {isOverdue && (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                    </Flex>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Issue Date
                    </Label>
                    <p className="font-medium">
                      {new Date(
                        invoice.issueDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Notes
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {invoice.notes || 'No notes'}
                    </p>
                  </div>
                </VStack>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              {payments.length} payment(s) recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VStack spacing={3} align="stretch">
              {payments.map((payment: any) => (
                <Flex
                  key={payment.id}
                  justify="space-between"
                  align="center"
                  className="p-3 border rounded-md"
                >
                  <Box>
                    <p className="font-medium">
                      {payment.paymentMethod.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        payment.paymentDate
                      ).toLocaleDateString()}
                      {payment.reference &&
                        ` | Ref: ${payment.reference}`}
                    </p>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {payment.notes}
                      </p>
                    )}
                  </Box>
                  <p className="font-semibold text-green-600">
                    ${parseFloat(payment.amount).toFixed(2)}
                  </p>
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
        title="Payment"
        hideFooter
      >
        <PaymentForm
          balanceDue={balanceDue}
          onSubmit={handleRecordPayment}
          isLoading={recordPaymentMutation.isPending}
        />
        <Flex justify="flex-end" gap={2} className="mt-4">
          <Button variant="outline" onClick={onPaymentClose}>
            Discard
          </Button>
          <Button
            onClick={() => {
              const form = document.querySelector('form');
              form?.requestSubmit();
            }}
            disabled={recordPaymentMutation.isPending}
          >
            {recordPaymentMutation.isPending
              ? 'Recording...'
              : 'payment'}
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

      {/* Delete Invoice Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone and will permanently remove the invoice and all its line items.`}
        confirmText="Delete Invoice"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
