import { useState } from 'react';
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
import { ArrowLeft, FileText, Plus, Send, Check, Eye, RefreshCw, TrendingUp, X, Trash2, Save, DollarSign } from 'lucide-react';
import { subscriptionApi, userApi, invoiceApi, Subscription } from '@/lib/api';
import { PaymentForm } from '@/pages/invoices/components/PaymentForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { FormDialog } from '@/components/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user: currentUser } = useAuthStore();

  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const { isOpen: isInvoiceOpen, onOpen: onInvoiceOpen, onClose: onInvoiceClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isPaymentOpen, onOpen: onPaymentOpen, onClose: onPaymentClose } = useDisclosure();
  const [startDate, setStartDate] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => subscriptionApi.get(id!),
    enabled: !!id,
  });

  // Fetch salesperson options (ADMIN & INTERNAL users)
  const { data: salespersonsData } = useQuery({
    queryKey: ['users', 'salespersons'],
    queryFn: () => userApi.list({ limit: 100 }),
  });

  const salespersons = (salespersonsData?.data?.items || []).filter(
    (u: any) => u.role === 'ADMIN' || u.role === 'INTERNAL'
  );

  // --- Mutations ---
  const quoteMutation = useMutation({
    mutationFn: () => subscriptionApi.quote(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast({ title: 'Quotation sent', status: 'success', duration: 3000 });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed', status: 'error', duration: 5000 });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (startDate?: string) => subscriptionApi.confirm(id!, startDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast({ title: 'Subscription confirmed', status: 'success', duration: 3000 });
      onConfirmClose();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed', status: 'error', duration: 5000 });
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => subscriptionApi.activate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast({ title: 'Subscription activated', status: 'success', duration: 3000 });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed', status: 'error', duration: 5000 });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => subscriptionApi.close(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast({ title: 'Subscription closed', status: 'success', duration: 3000 });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed', status: 'error', duration: 5000 });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionApi.cancel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast({ title: 'Subscription cancelled', status: 'success', duration: 3000 });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed', status: 'error', duration: 5000 });
    },
  });

  const renewMutation = useMutation({
    mutationFn: () => subscriptionApi.renew(id!),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      const newSub = response.data?.subscription;
      toast({ title: 'Subscription renewed', description: newSub ? `New subscription: ${newSub.subscriptionNumber}` : '', status: 'success', duration: 5000 });
      if (newSub?.id) navigate(`/subscriptions/${newSub.id}`);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to renew', status: 'error', duration: 5000 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => subscriptionApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast({ title: 'Subscription updated', status: 'success', duration: 3000 });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to update', status: 'error', duration: 5000 });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => subscriptionApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({ title: 'Subscription deleted', status: 'success', duration: 3000 });
      navigate('/subscriptions');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete', status: 'error', duration: 5000 });
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
      navigate(`/invoices/${response.data.invoice.id}`);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to generate invoice', status: 'error', duration: 5000 });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: { invoiceId: string; paymentData: any }) =>
      invoiceApi.recordPayment(data.invoiceId, data.paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Payment recorded',
        description: 'Payment has been recorded successfully',
        status: 'success',
        duration: 5000,
      });
      onPaymentClose();
      setSelectedInvoiceId(null);
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
    let subtotal = line.quantity * parseFloat(line.unitPrice);
    let discount = calculateLineDiscount(line);
    return (subtotal - discount) * (parseFloat(line.taxRate.rate) / 100);
  };

  const calculateTotals = () => {
    const lines = subscription.lines || [];
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    lines.forEach((line: any) => {
      const lineSubtotal = line.quantity * parseFloat(line.unitPrice);
      subtotal += lineSubtotal;
      totalDiscount += calculateLineDiscount(line);
      totalTax += calculateLineTax(line);
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
      toast({ title: 'Validation error', description: 'Please select a period start date', status: 'error', duration: 3000 });
      return;
    }
    // Convert date string (YYYY-MM-DD) to ISO datetime string
    const periodStartISO = new Date(periodStart + 'T00:00:00.000Z').toISOString();
    generateInvoiceMutation.mutate(periodStartISO);
  };

  const handleOpenPayment = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    onPaymentOpen();
  };

  const handleRecordPayment = (data: any) => {
    if (selectedInvoiceId) {
      recordPaymentMutation.mutate({ invoiceId: selectedInvoiceId, paymentData: data });
    }
  };

  // Find the most recent unpaid invoice
  const getUnpaidInvoice = () => {
    if (!subscription.invoices || subscription.invoices.length === 0) return null;
    return subscription.invoices
      .filter((inv: any) => {
        const total = parseFloat(inv.total || '0');
        const paid = parseFloat(inv.paidAmount || '0');
        return inv.status === 'CONFIRMED' && (total - paid) > 0;
      })
      .sort((a: any, b: any) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0];
  };

  const unpaidInvoice = getUnpaidInvoice();
  const balanceDue = unpaidInvoice
    ? parseFloat(unpaidInvoice.total || '0') - parseFloat(unpaidInvoice.paidAmount || '0')
    : 0;

  const defaultPeriodStart = subscription.nextBillingDate
    ? new Date(subscription.nextBillingDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  if (!periodStart && isInvoiceOpen) {
    setPeriodStart(defaultPeriodStart);
  }

  const isEditable = ['DRAFT', 'QUOTATION', 'CONFIRMED'].includes(subscription.status);

  // Status state badges (Quotation → quotation sent → confirmed)
  const getStatusStepIndex = () => {
    switch (subscription.status) {
      case 'DRAFT': return 0;
      case 'QUOTATION': return 1; // Quotation sent
      case 'CONFIRMED':
      case 'ACTIVE':
      case 'CLOSED':
        return 2; // Confirmed
      default: return 0;
    }
  };
  const statusStepIndex = getStatusStepIndex();

  return (
    <Box>
      {/* Back button */}
      <Flex align="center" gap={4} className="mb-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/subscriptions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Flex>

      {/* Top toolbar: New, Delete, Save | Send, Confirm, Preview */}
      <Flex
        justify="space-between"
        align="center"
        className="mb-4 p-3 bg-white border rounded-lg shadow-sm"
        wrap="wrap"
        gap={2}
      >
        <Flex gap={2} wrap="wrap" align="center">
          <Button size="sm" onClick={() => navigate('/subscriptions/new')}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>

          {subscription.status === 'DRAFT' && (
            <Button size="sm" variant="ghost" onClick={onDeleteOpen} title="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          {isEditable && (
            <Button size="sm" variant="ghost" onClick={() => {
              toast({ title: 'Saved', description: 'All changes are saved automatically', status: 'info', duration: 2000 });
            }} title="Save">
              <Save className="h-4 w-4" />
            </Button>
          )}

          {subscription.status === 'DRAFT' && (
            <>
              <Button size="sm" onClick={() => quoteMutation.mutate()} disabled={quoteMutation.isPending}>
                <Send className="h-4 w-4 mr-1" /> Send
              </Button>
              <Button size="sm" onClick={onConfirmOpen} disabled={confirmMutation.isPending}>
                <Check className="h-4 w-4 mr-1" /> Confirm
              </Button>
            </>
          )}

          {subscription.status === 'QUOTATION' && (
            <Button size="sm" onClick={onConfirmOpen} disabled={confirmMutation.isPending}>
              <Check className="h-4 w-4 mr-1" /> Confirm
            </Button>
          )}

          {/* Preview button only shows in QUOTATION state */}
          {subscription.status === 'QUOTATION' && (
            <Button size="sm" variant="outline" onClick={() => {
              window.open(`/subscriptions/${id}/preview`, '_blank');
            }}>
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
          )}
        </Flex>

        {/* Status state badges */}
        <Flex gap={2} align="center">
          <Badge
            variant={statusStepIndex >= 1 ? 'default' : 'outline'}
            className={statusStepIndex >= 1 ? 'bg-primary text-white' : statusStepIndex === 0 ? 'border-primary text-primary border-dashed border-2' : ''}
          >
            Quotation
          </Badge>
          <Badge
            variant={statusStepIndex >= 2 ? 'default' : 'outline'}
            className={statusStepIndex >= 2 ? 'bg-primary text-white' : statusStepIndex === 1 ? 'border-primary text-primary border-dashed border-2' : ''}
          >
            quotation sent
          </Badge>
          <Badge
            variant={statusStepIndex >= 2 ? 'default' : 'outline'}
            className={statusStepIndex >= 2 ? 'bg-primary text-white' : ''}
          >
            confirmed
          </Badge>
        </Flex>
      </Flex>

      {/* Lifecycle action buttons: Create Invoice, Cancel, Renew, Upsell - Only in CONFIRMED state */}
      {subscription.status === 'CONFIRMED' && (
        <>
          <Flex gap={2} className="mb-4" wrap="wrap">
            <Button
              size="sm"
              onClick={onInvoiceOpen}
            >
              <FileText className="h-4 w-4 mr-1" /> Create Invoice
            </Button>
            {/* Pay button - only enabled if there's an unpaid invoice */}
            {unpaidInvoice ? (
              <Button
                size="sm"
                onClick={() => handleOpenPayment(unpaidInvoice.id)}
              >
                <DollarSign className="h-4 w-4 mr-1" /> Pay Invoice
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled
                title={subscription.invoices && subscription.invoices.length > 0 
                  ? "All invoices are paid. Create a new invoice to make a payment." 
                  : "Create and confirm an invoice first, then you can make a payment"}
              >
                <DollarSign className="h-4 w-4 mr-1" /> Pay Invoice
              </Button>
            )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => renewMutation.mutate()}
            disabled={renewMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Renew
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/subscriptions/new?upsellFrom=${id}&userId=${subscription.userId}&planId=${subscription.planId}`)}
          >
            <TrendingUp className="h-4 w-4 mr-1" /> Upsell
          </Button>
          </Flex>
          {/* Helper message for Pay button */}
          {!unpaidInvoice && (
            <Box className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>To make a payment:</strong> First create an invoice using "Create Invoice" button above, 
                then confirm it on the invoice page. Once confirmed, the "Pay Invoice" button will be enabled.
              </p>
            </Box>
          )}
        </>
      )}

      {/* Close button for other states */}
      {subscription.status !== 'DRAFT' && subscription.status !== 'CONFIRMED' && (
        <Flex gap={2} className="mb-4" wrap="wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => closeMutation.mutate()}
            disabled={closeMutation.isPending || !['QUOTATION', 'ACTIVE'].includes(subscription.status)}
          >
            {closeMutation.isPending ? 'Closing...' : 'Close'}
          </Button>
        </Flex>
      )}

      {/* Read-only notice for confirmed+ subscriptions */}
      {['CONFIRMED', 'ACTIVE', 'CLOSED'].includes(subscription.status) && (
        <Box className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm font-medium">
            Once the Order is confirmed, no one can make any changes to the order line.
          </p>
        </Box>
      )}

      {/* Subscription Number */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">{subscription.subscriptionNumber}</h2>
            <p className="text-sm text-muted-foreground">
              Created {new Date(subscription.createdAt).toLocaleDateString()}
            </p>
          </div>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {/* Left column */}
            <VStack spacing={4} align="stretch">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Customer</Label>
                <p className="font-medium text-lg">{subscription.user?.name || '-'}</p>
                <p className="text-sm text-muted-foreground">{subscription.user?.email}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Quotation Template</Label>
                <p className="font-medium">{subscription.quotationTemplate || '-'}</p>
              </div>
            </VStack>

            {/* Right column */}
            <VStack spacing={4} align="stretch">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Expiration</Label>
                <p className="font-medium">
                  {subscription.expirationDate
                    ? new Date(subscription.expirationDate).toLocaleDateString()
                    : '-'}
                </p>
              </div>
              {subscription.orderDate && (
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Order Date</Label>
                  <p className="font-medium">{new Date(subscription.orderDate).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Recurring Plan</Label>
                <p className="font-medium">
                  {subscription.plan?.name || '-'}
                  {subscription.plan && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({subscription.plan.billingPeriod} / every {subscription.plan.intervalCount})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Payment Term</Label>
                <p className="font-medium">
                  {subscription.paymentTermDays ? `${subscription.paymentTermDays} days` : '-'}
                </p>
              </div>
              {subscription.nextBillingDate && (
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Next Invoice</Label>
                  <p className="font-medium">{new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
                </div>
              )}
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
              {subscription.lines && subscription.lines.length > 0 ? (
                <Box className="overflow-x-auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Product</Th>
                        <Th isNumeric>Quantity</Th>
                        <Th isNumeric>Unit Price</Th>
                        <Th isNumeric>Discount</Th>
                        <Th isNumeric>Taxes</Th>
                        <Th isNumeric>Amount</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {subscription.lines.map((line: any) => (
                        <Tr key={line.id}>
                          <Td>
                            <span className="font-medium">
                              {line.variant?.product?.name}
                              {line.variant?.name && ` - ${line.variant.name}`}
                            </span>
                          </Td>
                          <Td isNumeric>{line.quantity}</Td>
                          <Td isNumeric>₹{parseFloat(line.unitPrice).toFixed(2)}</Td>
                          <Td isNumeric>
                            {line.discount
                              ? line.discount.type === 'PERCENTAGE'
                                ? `${parseFloat(line.discount.value).toFixed(0)}%`
                                : `₹${parseFloat(line.discount.value).toFixed(2)}`
                              : '-'}
                          </Td>
                          <Td isNumeric>
                            {line.taxRate
                              ? `${line.taxRate.name} (${parseFloat(line.taxRate.rate).toFixed(0)}%)`
                              : '-'}
                          </Td>
                          <Td isNumeric className="font-semibold">
                            ₹{calculateLineTotal(line).toFixed(2)}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>

                  {/* Totals */}
                  <Box className="p-4 border-t space-y-2">
                    <Flex justify="flex-end" gap={8}>
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium w-24 text-right">₹{totals.subtotal.toFixed(2)}</span>
                    </Flex>
                    {totals.discount > 0 && (
                      <Flex justify="flex-end" gap={8}>
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium text-green-600 w-24 text-right">-₹{totals.discount.toFixed(2)}</span>
                      </Flex>
                    )}
                    {totals.tax > 0 && (
                      <Flex justify="flex-end" gap={8}>
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium w-24 text-right">₹{totals.tax.toFixed(2)}</span>
                      </Flex>
                    )}
                    <Flex justify="flex-end" gap={8} className="pt-2 border-t">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-lg font-bold text-primary w-24 text-right">₹{totals.total.toFixed(2)}</span>
                    </Flex>
                  </Box>
                </Box>
              ) : (
                <p className="text-center text-muted-foreground py-8">No order lines</p>
              )}
            </TabPanel>

            {/* Other Info Tab */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} className="p-2">
                <VStack spacing={4} align="stretch">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Salesperson</Label>
                    <p className="font-medium">
                      {subscription.salesperson?.name || currentUser?.name || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By default the login user is assigned as the Sales person. However only admin can change the Sales person.
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Payment Method</Label>
                    <p className="font-medium">
                      {subscription.paymentMethod
                        ? subscription.paymentMethod.replace(/_/g, ' ')
                        : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Which payment method is used for payment. It should be updated after payment is done.
                    </p>
                  </div>
                </VStack>

                <VStack spacing={4} align="stretch">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Start Date</Label>
                    <p className="font-medium">
                      {subscription.startDate
                        ? new Date(subscription.startDate).toLocaleDateString()
                        : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By default the day on which the quotation is confirmed will populate here. However this can be editable.
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Payment Done</Label>
                    <Flex align="center" gap={2}>
                      <Checkbox
                        isChecked={subscription.paymentDone}
                        isDisabled={!isEditable}
                        onChange={(e) => {
                          updateMutation.mutate({ paymentDone: e.target.checked });
                        }}
                      />
                      <span className="text-sm">{subscription.paymentDone ? 'Yes' : 'No'}</span>
                    </Flex>
                  </div>
                </VStack>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
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
                    <p className="font-semibold">₹{parseFloat(invoice.total).toFixed(2)}</p>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Subscription"
        message="Are you sure you want to delete this subscription? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />

      {/* Payment Dialog */}
      {selectedInvoiceId && (
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
              {recordPaymentMutation.isPending ? 'Recording...' : 'payment'}
            </Button>
          </Flex>
        </FormDialog>
      )}
    </Box>
  );
}
