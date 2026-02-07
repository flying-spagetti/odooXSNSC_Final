import { useState } from 'react';
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
  Input,
  InputGroup,
  InputRightElement,
  Progress,
} from '@chakra-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useCheckoutStore } from '@/store/checkoutStore';
import { subscriptionApi, discountApi } from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';

export default function CartPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const { setSubscriptionId, setStep, appliedDiscount, setAppliedDiscount } = useCheckoutStore();
  const [discountCode, setDiscountCode] = useState('');
  const [discountError, setDiscountError] = useState<string | null>(null);

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

      // Create a subscription for each plan (take first one for now)
      const firstPlanId = Object.keys(itemsByPlan)[0];
      const planItems = itemsByPlan[firstPlanId];

      // Create subscription
      const subscriptionRes = await subscriptionApi.create({
        userId: user!.id,
        planId: firstPlanId,
        notes: `Created from cart with ${planItems.length} items`,
      });

      // Add line items
      await Promise.all(
        planItems.map((item) =>
          subscriptionApi.addLine(subscriptionRes.data.subscription.id, {
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountId: appliedDiscount?.discount?.id,
          })
        )
      );

      return subscriptionRes.data.subscription;
    },
    onSuccess: (subscription) => {
      setSubscriptionId(subscription.id);
      setStep('address');
      navigate('/portal/checkout/address');
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

  const validateDiscountMutation = useMutation({
    mutationFn: (code: string) => {
      const cartItems = items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));
      return discountApi.validateCode({
        code,
        cartItems,
        userId: user?.id,
      });
    },
    onSuccess: (response) => {
      if (response.data.valid && response.data.discount && response.data.discountAmount !== undefined) {
        setAppliedDiscount({
          discount: response.data.discount,
          discountAmount: response.data.discountAmount,
        });
        setDiscountError(null);
        toast({
          title: 'Discount applied',
          description: `You have successfully applied ${response.data.discount.name}`,
          status: 'success',
          duration: 3000,
        });
      } else {
        setAppliedDiscount(null);
        setDiscountError(response.data.message || 'Invalid discount code');
        toast({
          title: 'Invalid discount code',
          description: response.data.message || 'The discount code you entered is not valid',
          status: 'error',
          duration: 3000,
        });
      }
    },
    onError: (error: any) => {
      setAppliedDiscount(null);
      const errorMessage = error.response?.data?.message || 'Failed to validate discount code';
      setDiscountError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 3000,
      });
    },
  });

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      toast({
        title: 'Please enter a discount code',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    validateDiscountMutation.mutate(discountCode.trim().toUpperCase());
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError(null);
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

  const handleBravePanther = () => {
    // Skip to order confirmation (for testing)
    if (items.length === 0) {
      toast({
        title: 'Cart is empty',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    // Create subscription and navigate directly to confirmation
    createSubscriptionMutation.mutate(items);
    // This will be handled after subscription creation
    setTimeout(() => {
      navigate('/portal/checkout/confirmation');
    }, 1000);
  };

  // Calculate totals
  const subtotal = getTotalPrice();
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const afterDiscount = subtotal - discountAmount;
  // Assuming 15% tax for now (should come from tax rates)
  const taxRate = 15;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;

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

      {/* Progress Indicator */}
      <Box mb={6}>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="sm" fontWeight="semibold" textDecoration="underline">
            Order
          </Text>
          <Text fontSize="sm" color="gray.500">
            Address
          </Text>
          <Text fontSize="sm" color="gray.500">
            Payment
          </Text>
        </Flex>
        <Progress value={33} size="sm" colorScheme="blue" />
      </Box>

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
                      <Td isNumeric>₹{item.unitPrice.toFixed(2)}/month</Td>
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
                        ₹{item.totalPrice.toFixed(2)}
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

              {/* Discount Code Section */}
              <Box mt={6} pt={6} borderTop="1px solid" borderColor="gray.200">
                <VStack align="stretch" spacing={3}>
                  <Text fontWeight="semibold">Discount Code</Text>
                  <InputGroup>
                    <Input
                      placeholder="Enter discount code"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value);
                        setDiscountError(null);
                      }}
                      isDisabled={!!appliedDiscount}
                      isInvalid={!!discountError}
                    />
                    <InputRightElement width="80px">
                      {appliedDiscount ? (
                        <Button size="sm" colorScheme="red" variant="ghost" onClick={handleRemoveDiscount}>
                          Remove
                        </Button>
                      ) : (
                        <Button size="sm" colorScheme="blue" onClick={handleApplyDiscount} isLoading={validateDiscountMutation.isPending}>
                          Apply
                        </Button>
                      )}
                    </InputRightElement>
                  </InputGroup>
                  {appliedDiscount && (
                    <Text fontSize="sm" color="green.600">
                      ✓ {appliedDiscount.discount.name} applied
                    </Text>
                  )}
                  {discountError && !appliedDiscount && (
                    <Text fontSize="sm" color="red.600">
                      {discountError}
                    </Text>
                  )}
                </VStack>
              </Box>

              {/* Brave Panther Button */}
              <Box mt={4}>
                <Button
                  variant="outline"
                  colorScheme="blue"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  onClick={handleBravePanther}
                >
                  Brave Panther
                </Button>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  (extra price)
                </Text>
              </Box>
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
                  <Text fontWeight="semibold">₹{subtotal.toFixed(2)}</Text>
                </Flex>
                {appliedDiscount && (
                  <Flex justify="space-between">
                    <Text color="green.600">Discount ({appliedDiscount.discount.name})</Text>
                    <Text color="green.600" fontWeight="semibold">
                      -₹{discountAmount.toFixed(2)}
                    </Text>
                  </Flex>
                )}
                <Flex justify="space-between">
                  <Text>Taxes ({taxRate}%)</Text>
                  <Text>₹{taxAmount.toFixed(2)}</Text>
                </Flex>
                <Box borderTop="1px solid" borderColor="gray.200" pt={4}>
                  <Flex justify="space-between">
                    <Text fontSize="lg" fontWeight="bold">
                      Total
                    </Text>
                    <Text fontSize="lg" fontWeight="bold">
                      ₹{total.toFixed(2)}
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
