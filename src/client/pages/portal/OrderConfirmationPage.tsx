import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  useToast,
} from '@chakra-ui/react';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, ShoppingBag } from 'lucide-react';
import { useCheckoutStore } from '@/store/checkoutStore';
import { subscriptionApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { subscriptionId, reset } = useCheckoutStore();

  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['subscription', subscriptionId],
    queryFn: () => subscriptionApi.get(subscriptionId!),
    enabled: !!subscriptionId,
  });

  useEffect(() => {
    if (!subscriptionId) {
      navigate('/portal/cart');
    }
  }, [subscriptionId, navigate]);

  const handlePrint = () => {
    if (subscriptionId) {
      window.open(`/api/v1/subscriptions/${subscriptionId}/pdf`, '_blank');
    }
  };

  const handleContinueShopping = () => {
    reset();
    navigate('/portal/shop');
  };

  const handleViewOrder = () => {
    if (subscriptionId) {
      navigate(`/portal/orders/${subscriptionId}`);
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Text>Loading...</Text>
      </Box>
    );
  }

  const subscription = subscriptionData?.data.subscription;

  if (!subscription) {
    return (
      <Box>
        <Text>Order not found</Text>
        <Button onClick={() => navigate('/portal/shop')}>Continue Shopping</Button>
      </Box>
    );
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
      <Flex gap={6} direction={{ base: 'column', lg: 'row' }}>
        {/* Confirmation Message */}
        <Box flex={1}>
          <Card>
            <CardContent pt={8}>
              <VStack align="stretch" spacing={6}>
                <VStack align="start" spacing={2}>
                  <Heading size="xl">Thank you for your order</Heading>
                  <HStack>
                    <Text fontSize="lg" fontWeight="semibold">
                      Order {subscription.subscriptionNumber}
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Printer className="h-4 w-4" />}
                      onClick={handlePrint}
                    >
                      Print
                    </Button>
                  </HStack>
                </VStack>

                <Box
                  p={4}
                  bg="green.50"
                  border="1px solid"
                  borderColor="green.200"
                  borderRadius="md"
                >
                  <Text color="green.800" fontWeight="semibold">
                    Your payment has been processed.
                  </Text>
                </Box>

                <HStack spacing={4} pt={4}>
                  <Button variant="outline" onClick={handleContinueShopping}>
                    Continue Shopping
                  </Button>
                  <Button colorScheme="blue" onClick={handleViewOrder}>
                    View Order
                  </Button>
                </HStack>
              </VStack>
            </CardContent>
          </Card>
        </Box>

        {/* Order Summary */}
        <Box width={{ base: '100%', lg: '350px' }}>
          <Card>
            <CardContent pt={6}>
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Order Summary</Heading>

                {/* Products */}
                {subscription.lines?.map((line: any, index: number) => (
                  <Flex key={index} justify="space-between" align="start">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="semibold">
                        {line.variant?.name || 'Product'} x {line.quantity}
                      </Text>
                      {line.discount && (
                        <Text fontSize="sm" color="green.600">
                          {line.discount.name}
                        </Text>
                      )}
                    </VStack>
                    <Text fontWeight="semibold">
                      ₹{(
                        line.quantity * parseFloat(line.unitPrice) +
                        (line.taxRate
                          ? (line.quantity * parseFloat(line.unitPrice)) *
                            (parseFloat(line.taxRate.rate) / 100)
                          : 0)
                      ).toFixed(2)}
                    </Text>
                  </Flex>
                ))}

                <Box borderTop="1px solid" borderColor="gray.200" pt={4}>
                  <Flex justify="space-between" mb={2}>
                    <Text>Subtotal</Text>
                    <Text fontWeight="semibold">₹{totals.subtotal.toFixed(2)}</Text>
                  </Flex>
                  <Flex justify="space-between" mb={2}>
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
                </Box>
              </VStack>
            </CardContent>
          </Card>
        </Box>
      </Flex>
    </Box>
  );
}
