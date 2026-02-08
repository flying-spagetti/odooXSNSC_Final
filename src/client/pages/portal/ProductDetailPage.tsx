import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Badge,
  Image,
} from '@chakra-ui/react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { productApi, planApi, ProductVariant, RecurringPlan } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { Card, CardContent } from '@/components/ui/card';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/utils';

interface PricingOption {
  plan: RecurringPlan;
  months: number;
  totalPrice: number;
  monthlyPrice: number;
  discount: number;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { addItem } = useCartStore();
  const { isOpen: isVariantOpen, onOpen: onVariantOpen, onClose: onVariantClose } = useDisclosure();
  
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.get(id!),
    enabled: !!id,
  });

  const { data: variantsData, isLoading: variantsLoading } = useQuery({
    queryKey: ['product-variants', id],
    queryFn: () => productApi.listVariants(id!),
    enabled: !!id,
  });

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['plans', 'active'],
    queryFn: () => planApi.list({ limit: 100 }),
  });

  const product = productData?.data.product;
  const variants = variantsData?.data.variants?.filter((v) => v.isActive) || [];
  const allPlans = plansData?.data.items?.filter((p) => p.isActive) || [];

  // Create pricing plans: Monthly, 6 Months, Yearly
  const pricingPlans = useMemo(() => {
    // Find or create plans for Monthly, 6 Months, and Yearly
    const monthlyPlan = allPlans.find((p) => p.billingPeriod === 'MONTHLY' && p.intervalCount === 1);
    const sixMonthPlan = allPlans.find((p) => p.billingPeriod === 'MONTHLY' && p.intervalCount === 6);
    const yearlyPlan = allPlans.find((p) => p.billingPeriod === 'YEARLY' && p.intervalCount === 1);

    // If plans don't exist, create virtual plans for display
    const plans: PricingOption[] = [];
    
    if (monthlyPlan) {
      plans.push({
        plan: monthlyPlan,
        months: 1,
        totalPrice: 0, // Will be calculated based on variant
        monthlyPrice: 0,
        discount: 0,
      });
    }

    if (sixMonthPlan) {
      plans.push({
        plan: sixMonthPlan,
        months: 6,
        totalPrice: 0,
        monthlyPrice: 0,
        discount: 10, // 10% discount for 6 months
      });
    }

    if (yearlyPlan) {
      plans.push({
        plan: yearlyPlan,
        months: 12,
        totalPrice: 0,
        monthlyPrice: 0,
        discount: 20, // 20% discount for yearly
      });
    }

    // If no plans found, create default virtual plans
    if (plans.length === 0) {
      plans.push(
        { plan: { id: 'monthly', name: 'Monthly', billingPeriod: 'MONTHLY', intervalCount: 1 } as RecurringPlan, months: 1, totalPrice: 0, monthlyPrice: 0, discount: 0 },
        { plan: { id: '6months', name: '6 Months', billingPeriod: 'MONTHLY', intervalCount: 6 } as RecurringPlan, months: 6, totalPrice: 0, monthlyPrice: 0, discount: 10 },
        { plan: { id: 'yearly', name: 'Yearly', billingPeriod: 'YEARLY', intervalCount: 1 } as RecurringPlan, months: 12, totalPrice: 0, monthlyPrice: 0, discount: 20 }
      );
    }

    return plans;
  }, [allPlans]);

  // Calculate pricing for selected variant
  const pricingTable = useMemo(() => {
    if (!selectedVariantId) return [];
    
    const variant = variants.find((v) => v.id === selectedVariantId);
    if (!variant) return [];

    const basePrice = parseFloat(variant.basePrice);

    return pricingPlans.map((pricingOption) => {
      const totalPrice = basePrice * pricingOption.months;
      const discountedTotal = pricingOption.discount > 0 
        ? totalPrice * (1 - pricingOption.discount / 100)
        : totalPrice;
      const monthlyPrice = discountedTotal / pricingOption.months;

      return {
        ...pricingOption,
        totalPrice: discountedTotal,
        monthlyPrice,
      };
    });
  }, [selectedVariantId, variants, pricingPlans]);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  const handleAddToCart = (planId: string, planName: string, billingPeriod: 'MONTHLY' | 'YEARLY', intervalCount: number) => {
    if (!selectedVariantId) {
      toast({
        title: 'Please select a variant',
        status: 'warning',
        duration: 3000,
      });
      onVariantOpen();
      return;
    }

    const variant = variants.find((v) => v.id === selectedVariantId);
    if (!variant) return;

    const pricingOption = pricingTable.find((p) => p.plan.id === planId);
    if (!pricingOption) return;

    addItem({
      variantId: variant.id,
      variant: { ...variant, product },
      quantity,
      planId,
      planName,
      billingPeriod,
      intervalCount,
      unitPrice: pricingOption.monthlyPrice,
      discount: pricingOption.discount,
    });

    toast({
      title: 'Added to cart',
      description: `${variant.name} (${planName}) added to cart`,
      status: 'success',
      duration: 3000,
    });
  };

  if (productLoading || variantsLoading || plansLoading) {
    return (
      <Box>
        <Text>Loading product...</Text>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box>
        <Text>Product not found</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumb */}
      <HStack mb={6} spacing={2} color="gray.600" fontSize="sm">
        <Button variant="ghost" size="sm" onClick={() => navigate('/portal/shop')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>
        <Text>/</Text>
        <Text>All products</Text>
        <Text>/</Text>
        <Text>{product.name}</Text>
      </HStack>

      <Flex gap={8} direction={{ base: 'column', lg: 'row' }}>
        {/* Left: Product Images */}
        <Box flex={1}>
          <VStack spacing={4} align="stretch">
            {/* Product Images */}
            <Box
              width="100%"
              height="500px"
              borderRadius="md"
              overflow="hidden"
              className="bg-gray-100"
            >
              <Image
                src={selectedVariant?.imageUrl || product.imageUrl || DEFAULT_PRODUCT_IMAGE}
                alt={product.name}
                width="100%"
                height="500px"
                objectFit="cover"
              />
            </Box>
          </VStack>
        </Box>

        {/* Right: Product Details */}
        <Box flex={1}>
          <VStack align="stretch" spacing={6}>
            <Heading as="h1" size="xl">
              {product.name}
            </Heading>

            {/* Variants Selector */}
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Variants available
              </Text>
              {variants.length === 0 ? (
                <Text color="gray.500">No variants available</Text>
              ) : (
                <VStack align="stretch" spacing={2}>
                  <Select
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    placeholder="Select a variant"
                  >
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name} - ${parseFloat(variant.basePrice).toFixed(2)}/month
                      </option>
                    ))}
                  </Select>
                  {selectedVariant && (
                    <Text fontSize="sm" color="gray.600">
                      {selectedVariant.description || 'No description'}
                    </Text>
                  )}
                </VStack>
              )}
            </Box>

            {/* Pricing Table */}
            {selectedVariantId && pricingTable.length > 0 && (
              <Card>
                <CardContent>
                  <VStack align="stretch" spacing={4}>
                    <Heading as="h3" size="md">
                      Pricing Options
                    </Heading>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Plan</Th>
                          <Th isNumeric>Total</Th>
                          <Th isNumeric>Per Month</Th>
                          <Th>Discount</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {pricingTable.map((option) => (
                          <Tr key={option.plan.id}>
                            <Td fontWeight="semibold">{option.plan.name}</Td>
                            <Td isNumeric>${option.totalPrice.toFixed(2)}</Td>
                            <Td isNumeric>${option.monthlyPrice.toFixed(2)}/month</Td>
                            <Td>
                              {option.discount > 0 ? (
                                <Badge colorScheme="green">{option.discount}%</Badge>
                              ) : (
                                <Text>-</Text>
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </VStack>
                </CardContent>
              </Card>
            )}

            {/* Product Category */}
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Product category
              </Text>
              <Text>{product.name}</Text>
            </Box>

            {/* Quantity and Add to Cart */}
            {selectedVariantId && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Quantity
                  </Text>
                  <HStack>
                    <NumberInput
                      value={quantity}
                      onChange={(_, value) => setQuantity(value || 1)}
                      min={1}
                      max={100}
                      width="120px"
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </HStack>
                </Box>

                <VStack align="stretch" spacing={2}>
                  {pricingTable.map((option) => (
                    <Button
                      key={option.plan.id}
                      colorScheme="blue"
                      leftIcon={<ShoppingCart />}
                      onClick={() =>
                        handleAddToCart(
                          option.plan.id,
                          option.plan.name,
                          option.plan.billingPeriod as 'MONTHLY' | 'YEARLY',
                          option.plan.intervalCount
                        )
                      }
                    >
                      Add to Cart - {option.plan.name}
                    </Button>
                  ))}
                </VStack>
              </VStack>
            )}

            {/* Terms and Conditions */}
            <VStack align="stretch" spacing={2} pt={4} borderTop="1px solid" borderColor="gray.200">
              <Text fontSize="sm" color="gray.600">
                • Terms and conditions
              </Text>
              <Text fontSize="sm" color="gray.600">
                • 30 day money back guarantee
              </Text>
              <Text fontSize="sm" color="gray.600">
                • Shipping 2-3 Business days
              </Text>
            </VStack>
          </VStack>
        </Box>
      </Flex>

      {/* Variant Selection Modal */}
      <Modal isOpen={isVariantOpen} onClose={onVariantClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Variant</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              {variants.map((variant) => (
                <Button
                  key={variant.id}
                  variant={selectedVariantId === variant.id ? 'solid' : 'outline'}
                  onClick={() => {
                    setSelectedVariantId(variant.id);
                    onVariantClose();
                  }}
                >
                  {variant.name} - ${parseFloat(variant.basePrice).toFixed(2)}/month
                </Button>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
