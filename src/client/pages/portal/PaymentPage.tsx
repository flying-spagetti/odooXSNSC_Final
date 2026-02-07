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
  useToast,
  Progress,
  Spinner,
} from '@chakra-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useCheckoutStore } from '@/store/checkoutStore';
import { useCartStore } from '@/store/cartStore';
import { paymentApi } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { subscriptionId, setStep } = useCheckoutStore();
  const { getTotalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    // Check if already loaded
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
    };
    document.body.appendChild(script);

    return () => {
      // Only remove if script was added
      if (script.parentNode) {
        try {
          document.body.removeChild(script);
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);

  // Create payment order
  const createOrderMutation = useMutation({
    mutationFn: (amount: number) =>
      paymentApi.createOrder({
        subscriptionId: subscriptionId!,
        amount,
      }),
    onError: (error: any) => {
      // Error handling is done in the catch block
    },
  });

  // Verify payment
  const verifyPaymentMutation = useMutation({
    mutationFn: (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      invoiceId: string;
    }) => paymentApi.verifyPayment(data),
    onSuccess: () => {
      clearCart();
      setStep('confirmation');
      navigate('/portal/checkout/confirmation');
    },
    onError: (error: any) => {
      toast({
        title: 'Payment failed',
        description: error.response?.data?.message || 'Payment verification failed',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const handlePayment = async () => {
    if (!subscriptionId) {
      toast({
        title: 'Error',
        description: 'No subscription found',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!razorpayLoaded || !window.Razorpay) {
      toast({
        title: 'Payment gateway not loaded',
        description: 'Please wait for the payment gateway to load',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      // Calculate total
      const subtotal = getTotalPrice();
      const taxRate = 15;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      // Create Razorpay order
      const orderResponse = await createOrderMutation.mutateAsync(total);
      const order = orderResponse.data.order;
      const invoiceId = orderResponse.data.invoiceId;
      const keyId = orderResponse.data.keyId; // Use the key_id from backend to ensure it matches the order

      // Validate order data
      if (!order || !order.id) {
        throw new Error('Invalid order data received from server');
      }

      if (!invoiceId) {
        throw new Error('Invoice ID not found in order response');
      }

      if (!keyId) {
        throw new Error('Razorpay key ID not provided by server');
      }

      // Initialize Razorpay checkout
      const options = {
        key: keyId, // Use the key_id from backend to ensure it matches the order
        // When using order_id, do not pass amount separately - Razorpay uses the amount from the order
        currency: order.currency,
        name: 'Subscription Management',
        description: `Payment for subscription ${subscriptionId}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Verify payment
            await verifyPaymentMutation.mutateAsync({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoiceId: invoiceId,
            });
          } catch (error) {
            console.error('Payment verification error:', error);
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast({
              title: 'Payment cancelled',
              status: 'info',
              duration: 3000,
            });
          },
        },
        // Add error handler - Razorpay uses 'handler' for success and 'error' for errors
        error: function (error: any) {
          setLoading(false);
          toast({
            title: 'Payment failed',
            description: error?.error?.description || 'Payment processing failed',
            status: 'error',
            duration: 5000,
          });
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        setLoading(false);
        toast({
          title: 'Payment failed',
          description: response?.error?.description || 'Payment processing failed',
          status: 'error',
          duration: 5000,
        });
      });
      try {
        razorpay.open();
      } catch (error: any) {
        setLoading(false);
        toast({
          title: 'Payment initialization failed',
          description: error?.message || 'Failed to open payment gateway',
          status: 'error',
          duration: 5000,
        });
      }
      setLoading(false);
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/560fc7f4-b843-4e0a-bc5f-05cc6d3cbc42',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaymentPage.tsx:185',message:'payment initialization error caught',data:{errorMessage:error?.message,errorResponse:error?.response?.data,errorStatus:error?.response?.status,errorCode:error?.code,stack:error?.stack?.substring(0,500)},timestamp:Date.now(),hypothesisId:'H',runId:'run1'})}).catch(()=>{});
      // #endregion
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to initialize payment',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleBack = () => {
    navigate('/portal/checkout/address');
  };

  // Calculate totals
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
          Payment
        </Heading>
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Address
        </Button>
      </Flex>

      {/* Progress Indicator */}
      <Box mb={6}>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="sm" color="gray.500">
            Order
          </Text>
          <Text fontSize="sm" color="gray.500">
            Address
          </Text>
          <Text fontSize="sm" fontWeight="semibold" textDecoration="underline">
            Payment
          </Text>
        </Flex>
        <Progress value={100} size="sm" colorScheme="blue" />
      </Box>

      <Flex gap={6} direction={{ base: 'column', lg: 'row' }}>
        {/* Payment Section */}
        <Box flex={1}>
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <VStack align="stretch" spacing={4}>
                <Text>
                  For payment, any demo or testing beta version payment gateway will work and
                  accordingly page should be implemented.
                </Text>

                {!razorpayLoaded && (
                  <Box textAlign="center" py={8}>
                    <Spinner size="lg" />
                    <Text mt={4}>Loading payment gateway...</Text>
                  </Box>
                )}

                <HStack spacing={4} pt={4}>
                  <Button variant="outline" onClick={handleBack} flex={1}>
                    Back
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={handlePayment}
                    flex={1}
                    isLoading={loading || createOrderMutation.isPending}
                    loadingText="Processing..."
                    isDisabled={!razorpayLoaded}
                  >
                    Pay ₹{total.toFixed(2)}
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
