import { useNavigate } from 'react-router-dom';
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Badge,
} from '@chakra-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { subscriptionApi } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';

export default function CartPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();

  const createSubscriptionMutation = useMutation({
    mutationFn: async (cartItems: typeof items) => {
      // Group items by plan
      const itemsByPlan = cartItems.reduce((acc, item) => {
        if (!acc[item.planId]) {
          acc[item.planId] = [];
        }
        acc[item.planId].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      // Create a subscription for each plan
      const subscriptions = await Promise.all(
        Object.entries(itemsByPlan).map(async ([planId, planItems]) => {
          // Create subscription
          const subscriptionRes = await subscriptionApi.create({
            userId: user!.id,
            planId,
            notes: `Created from cart with ${planItems.length} items`,
          });

          // Add line items
          await Promise.all(
            planItems.map((item) =>
              subscriptionApi.addLine(subscriptionRes.data.subscription.id, {
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              })
            )
          );

          return subscriptionRes.data.subscription;
        })
      );

      return subscriptions;
    },
    onSuccess: () => {
      clearCart();
      toast({
        title: 'Subscription created',
        description: 'Your subscription has been created successfully',
        status: 'success',
        duration: 3000,
      });
      navigate('/portal/subscriptions');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create subscription',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const handleQuantityChange = (variantId: string, planId: string, newQuantity: number) => {
    updateQuantity(variantId, planId, newQuantity);
  };

  const handleRemove = (variantId: string, planId: string) => {
    removeItem(variantId, planId);
    toast({
      title: 'Item removed',
      status: 'success',
      duration: 2000,
    });
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        title: 'Cart is empty',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    createSubscriptionMutation.mutate(items);
  };

  if (items.length === 0) {
    return (
      <Box>
        <Button variant="ghost" size="sm" onClick={() => navigate('/portal/shop')} mb={6}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>
        <VStack spacing={4} py={12}>
          <ShoppingBag className="h-16 w-16 text-gray-400" />
          <Heading size="lg">Your cart is empty</Heading>
          <Text color="gray.600">Add some products to get started</Text>
          <Button onClick={() => navigate('/portal/shop')} colorScheme="blue">
            Browse Products
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">
          Shopping Cart
        </Heading>
        <Button variant="ghost" size="sm" onClick={() => navigate('/portal/shop')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Button>
      </Flex>

      <Flex gap={6} direction={{ base: 'column', lg: 'row' }}>
        {/* Cart Items */}
        <Box flex={1}>
          <Card>
            <CardHeader>
              <CardTitle>Cart Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Product</Th>
                    <Th>Plan</Th>
                    <Th isNumeric>Price</Th>
                    <Th>Quantity</Th>
                    <Th isNumeric>Total</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.map((item) => (
                    <Tr key={`${item.variantId}-${item.planId}`}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold">
                            {item.variant.product?.name || 'Product'}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {item.variant.name}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text>{item.planName}</Text>
                          {item.discount && item.discount > 0 && (
                            <Badge colorScheme="green">{item.discount}% off</Badge>
                          )}
                        </VStack>
                      </Td>
                      <Td isNumeric>
                        ${item.unitPrice.toFixed(2)}/month
                      </Td>
                      <Td>
                        <NumberInput
                          value={item.quantity}
                          onChange={(_, value) =>
                            handleQuantityChange(item.variantId, item.planId, value || 1)
                          }
                          min={1}
                          max={100}
                          width="100px"
                          size="sm"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </Td>
                      <Td isNumeric fontWeight="semibold">
                        ${item.totalPrice.toFixed(2)}
                      </Td>
                      <Td>
                        <Button
                          variant="ghost"
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleRemove(item.variantId, item.planId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardContent>
          </Card>
        </Box>

        {/* Order Summary */}
        <Box width={{ base: '100%', lg: '350px' }}>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <VStack align="stretch" spacing={4}>
                <Flex justify="space-between">
                  <Text>Subtotal</Text>
                  <Text fontWeight="semibold">${getTotalPrice().toFixed(2)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text>Tax</Text>
                  <Text>$0.00</Text>
                </Flex>
                <Box borderTop="1px solid" borderColor="gray.200" pt={4}>
                  <Flex justify="space-between">
                    <Text fontSize="lg" fontWeight="bold">
                      Total
                    </Text>
                    <Text fontSize="lg" fontWeight="bold">
                      ${getTotalPrice().toFixed(2)}
                    </Text>
                  </Flex>
                </Box>
                <Button
                  colorScheme="blue"
                  size="lg"
                  width="100%"
                  onClick={handleCheckout}
                  isLoading={createSubscriptionMutation.isPending}
                  loadingText="Processing..."
                >
                  Checkout
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  width="100%"
                  onClick={() => clearCart()}
                >
                  Clear Cart
                </Button>
              </VStack>
            </CardContent>
          </Card>
        </Box>
      </Flex>
    </Box>
  );
}
