import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RotateCcw, FileText } from 'lucide-react';
import { subscriptionApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';

export default function OrdersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: subscriptionsData, isLoading } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: () => subscriptionApi.list({ userId: user?.id, limit: 100 }),
    enabled: !!user?.id,
  });

  const renewMutation = useMutation({
    mutationFn: (subscriptionId: string) => subscriptionApi.renew(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: 'Order renewed',
        description: 'A new order has been created',
        status: 'success',
        duration: 3000,
      });
    },
  });

  const handleOrderClick = (subscriptionId: string) => {
    navigate(`/portal/orders/${subscriptionId}`);
  };

  const handleDownload = (subscriptionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/v1/subscriptions/${subscriptionId}/pdf`, '_blank');
  };

  const handleRenew = (subscriptionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    renewMutation.mutate(subscriptionId);
  };

  const handleInvoice = (subscriptionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to invoices page filtered by subscription
    navigate(`/invoices?subscriptionId=${subscriptionId}`);
  };

  // Calculate total for a subscription
  const calculateTotal = (subscription: any) => {
    if (!subscription.lines || subscription.lines.length === 0) return 0;
    let total = 0;
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
      total += afterDiscount + tax;
    });
    return total;
  };

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  const subscriptions = subscriptionsData?.data.items || [];

  return (
    <Box>
      <Heading as="h1" size="xl" mb={6}>
        My Orders
      </Heading>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text color="gray.600">No orders found</Text>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Order</Th>
                  <Th>Order Date</Th>
                  <Th>Total</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {subscriptions.map((subscription: any) => {
                  const total = calculateTotal(subscription);
                  const orderDate = subscription.orderDate
                    ? new Date(subscription.orderDate).toLocaleDateString()
                    : subscription.createdAt
                    ? new Date(subscription.createdAt).toLocaleDateString()
                    : 'N/A';

                  return (
                    <Tr
                      key={subscription.id}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handleOrderClick(subscription.id)}
                    >
                      <Td>
                        <Button
                          variant="link"
                          onClick={() => handleOrderClick(subscription.id)}
                        >
                          {subscription.subscriptionNumber}
                        </Button>
                      </Td>
                      <Td>{orderDate}</Td>
                      <Td>₹{total.toFixed(2)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<Download className="h-4 w-4" />}
                            onClick={(e) => handleDownload(subscription.id, e)}
                          >
                            PDF
                          </Button>
                          {!subscription.paymentDone && (
                            <Button
                              size="sm"
                              variant="ghost"
                              leftIcon={<RotateCcw className="h-4 w-4" />}
                              onClick={(e) => handleRenew(subscription.id, e)}
                              isLoading={renewMutation.isPending}
                            >
                              Renew
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<FileText className="h-4 w-4" />}
                            onClick={(e) => handleInvoice(subscription.id, e)}
                          >
                            Invoice
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
