import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Badge,
} from '@chakra-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RotateCcw, X } from 'lucide-react';
import { subscriptionApi, invoiceApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => subscriptionApi.get(id!),
    enabled: !!id,
  });

  const renewMutation = useMutation({
    mutationFn: () => subscriptionApi.renew(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: 'Order renewed',
        description: 'A new order has been created',
        status: 'success',
        duration: 3000,
      });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => subscriptionApi.close(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast({
        title: 'Order closed',
        status: 'success',
        duration: 3000,
      });
    },
  });

  const handleDownload = () => {
    if (id) {
      window.open(`/api/v1/subscriptions/${id}/pdf`, '_blank');
    }
  };

  const handleRenew = () => {
    renewMutation.mutate();
  };

  const handleClose = () => {
    if (window.confirm('Are you sure you want to close this order?')) {
      closeMutation.mutate();
    }
  };

  const handleInvoiceClick = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
  };

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  const subscription = subscriptionData?.data.subscription;
  if (!subscription) {
    return <Box>Order not found</Box>;
  }

  // Calculate totals
  const calculateTotals = () => {
    if (!subscription.lines || subscription.lines.length === 0) {
      return { subtotal: 0, tax: 0, total: 0 };
    }

    let subtotal = 0;
    let totalTax = 0;

    subscription.lines.forEach((line: any) => {
      const lineSubtotal = line.quantity * parseFloat(line.unitPrice);
      let discount = 0;
      if (line.discount) {
        if (line.discount.type === 'PERCENTAGE') {
          discount = lineSubtotal * (parseFloat(line.discount.value) / 100);
        } else {
          discount = parseFloat(line.discount.value);
        }
      }
      const afterDiscount = lineSubtotal - discount;
      const tax = line.taxRate ? afterDiscount * (parseFloat(line.taxRate.rate) / 100) : 0;
      subtotal += afterDiscount;
      totalTax += tax;
    });

    return {
      subtotal,
      tax: totalTax,
      total: subtotal + totalTax,
    };
  };

  const totals = calculateTotals();

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">
          Order / {subscription.subscriptionNumber}
        </Heading>
        <HStack>
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleDownload}
          >
            Download
          </Button>
          {!subscription.paymentDone && (
            <Button
              variant="outline"
              leftIcon={<RotateCcw className="h-4 w-4" />}
              onClick={handleRenew}
              isLoading={renewMutation.isPending}
            >
              Renew
            </Button>
          )}
          <Button
            variant="outline"
            colorScheme="red"
            leftIcon={<X className="h-4 w-4" />}
            onClick={handleClose}
            isLoading={closeMutation.isPending}
          >
            Close
          </Button>
        </HStack>
      </Flex>

      <VStack align="stretch" spacing={6}>
        {/* Subscription Details */}
        <Card>
          <CardHeader>
            <CardTitle>Your Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <VStack align="stretch" spacing={3}>
              <Flex justify="space-between">
                <Text fontWeight="semibold">Plan:</Text>
                <Text>{subscription.plan?.name || 'N/A'}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontWeight="semibold">Start Date:</Text>
                <Text>
                  {subscription.startDate
                    ? new Date(subscription.startDate).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontWeight="semibold">End Date:</Text>
                <Text>
                  {subscription.expirationDate
                    ? new Date(subscription.expirationDate).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontWeight="semibold">State of subscription:</Text>
                <Badge colorScheme={subscription.status === 'ACTIVE' ? 'green' : 'gray'}>
                  {subscription.status}
                </Badge>
              </Flex>
            </VStack>
          </CardContent>
        </Card>

        {/* Invoicing and Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle>Invoicing and Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <VStack align="stretch" spacing={2}>
              <Text>
                <strong>Name:</strong> {subscription.user?.name || 'N/A'}
              </Text>
              <Text>
                <strong>Email:</strong> {subscription.user?.email || 'N/A'}
              </Text>
              <Text>
                <strong>Phone Number:</strong> {subscription.user?.phone || 'N/A'}
              </Text>
              <Text>
                <strong>Address:</strong> {subscription.user?.address || 'N/A'}
              </Text>
            </VStack>
          </CardContent>
        </Card>

        {/* Last Invoices */}
        {subscription.invoices && subscription.invoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Last Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Invoice number</Th>
                    <Th>Payment status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {subscription.invoices.map((invoice: any) => (
                    <Tr key={invoice.id}>
                      <Td>
                        <Button
                          variant="link"
                          onClick={() => handleInvoiceClick(invoice.id)}
                        >
                          {invoice.invoiceNumber}
                        </Button>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={
                            invoice.status === 'PAID'
                              ? 'green'
                              : invoice.status === 'CONFIRMED'
                              ? 'yellow'
                              : 'gray'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Product Name</Th>
                  <Th>Quantity</Th>
                  <Th>Unit Price</Th>
                  <Th>Taxes</Th>
                  <Th>Amount</Th>
                </Tr>
              </Thead>
              <Tbody>
                {subscription.lines?.map((line: any, index: number) => {
                  const lineSubtotal = line.quantity * parseFloat(line.unitPrice);
                  let discount = 0;
                  if (line.discount) {
                    if (line.discount.type === 'PERCENTAGE') {
                      discount = lineSubtotal * (parseFloat(line.discount.value) / 100);
                    } else {
                      discount = parseFloat(line.discount.value);
                    }
                  }
                  const afterDiscount = lineSubtotal - discount;
                  const tax = line.taxRate ? afterDiscount * (parseFloat(line.taxRate.rate) / 100) : 0;
                  const lineTotal = afterDiscount + tax;

                  return (
                    <Tr key={line.id || index}>
                      <Td>
                        {line.variant?.name || 'Product'}
                        {line.discount && (
                          <Text fontSize="sm" color="green.600">
                            {line.discount.name}
                          </Text>
                        )}
                      </Td>
                      <Td>{line.quantity}</Td>
                      <Td>₹{parseFloat(line.unitPrice).toFixed(2)}</Td>
                      <Td>{line.taxRate ? `${line.taxRate.rate}%` : '0%'}</Td>
                      <Td>₹{lineTotal.toFixed(2)}</Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>

            {/* Summary */}
            <Box mt={6} pt={4} borderTop="1px solid" borderColor="gray.200">
              <VStack align="stretch" spacing={2}>
                <Flex justify="space-between">
                  <Text>Untaxed Amount</Text>
                  <Text fontWeight="semibold">₹{totals.subtotal.toFixed(2)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text>Tax</Text>
                  <Text>₹{totals.tax.toFixed(2)}</Text>
                </Flex>
                <Flex justify="space-between" pt={2} borderTop="1px solid" borderColor="gray.200">
                  <Text fontSize="lg" fontWeight="bold">
                    Total
                  </Text>
                  <Text fontSize="lg" fontWeight="bold">
                    ₹{totals.total.toFixed(2)}
                  </Text>
                </Flex>
              </VStack>
            </Box>
          </CardContent>
        </Card>
      </VStack>
    </Box>
  );
}
