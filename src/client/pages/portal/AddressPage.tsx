import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  useToast,
  Progress,
} from '@chakra-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCheckoutStore } from '@/store/checkoutStore';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { userApi } from '@/lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';

export default function AddressPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const { subscriptionId, address, setAddress, setStep } = useCheckoutStore();
  const { getTotalPrice } = useCartStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [useDifferentAddress, setUseDifferentAddress] = useState(false);

  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ['user', user?.id],
    queryFn: () => userApi.get(user!.id),
    enabled: !!user?.id,
  });

  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { name?: string; phone?: string; address?: string }) =>
      userApi.updateProfile(user!.id, data),
    onSuccess: () => {
      toast({
        title: 'Address updated',
        status: 'success',
        duration: 3000,
      });
    },
  });

  useEffect(() => {
    if (userData?.data.user) {
      const user = userData.data.user;
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [userData]);

  useEffect(() => {
    if (address) {
      setFormData(address);
    }
  }, [address]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      toast({
        title: 'Please fill in all required fields',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    // Save address to checkout store
    setAddress(formData);

    // Update user profile if different address is not selected
    if (!useDifferentAddress) {
      updateProfileMutation.mutate({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      });
    }

    // Navigate to payment page
    setStep('payment');
    navigate('/portal/checkout/payment');
  };

  const handleBack = () => {
    navigate('/portal/cart');
  };

  // Calculate totals (same as cart)
  const subtotal = getTotalPrice();
  const taxRate = 15;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  if (!subscriptionId) {
    return (
      <Box>
        <Text>No subscription found. Please start from cart.</Text>
        <Button onClick={() => navigate('/portal/cart')}>Go to Cart</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">
          Shipping Address
        </Heading>
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>
      </Flex>

      {/* Progress Indicator */}
      <Box mb={6}>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="sm" color="gray.500">
            Order
          </Text>
          <Text fontSize="sm" fontWeight="semibold" textDecoration="underline">
            Address
          </Text>
          <Text fontSize="sm" color="gray.500">
            Payment
          </Text>
        </Flex>
        <Progress value={66} size="sm" colorScheme="blue" />
      </Box>

      <Flex gap={6} direction={{ base: 'column', lg: 'row' }}>
        {/* Address Form */}
        <Box flex={1}>
          <Card>
            <CardHeader>
              <CardTitle>Invoicing and Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text mb={2} fontWeight="semibold">
                    Name *
                  </Text>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your name"
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="semibold">
                    Email *
                  </Text>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={formData.email}
                    
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="semibold">
                    Phone Number *
                  </Text>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="semibold">
                    Address *
                  </Text>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your address"
                  />
                </Box>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseDifferentAddress(!useDifferentAddress)}
                >
                  {useDifferentAddress
                    ? 'Use default address'
                    : 'Use different shipping address'}
                </Button>

                <HStack spacing={4} pt={4}>
                  <Button variant="outline" onClick={handleBack} flex={1}>
                    Back
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={handleContinue}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    flex={1}
                  >
                    Continue to Payment
                  </Button>
                </HStack>
              </VStack>
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
              </VStack>
            </CardContent>
          </Card>
        </Box>
      </Flex>
    </Box>
  );
}
