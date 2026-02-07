import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Flex, VStack, SimpleGrid, useToast } from '@chakra-ui/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { subscriptionApi, planApi, userApi, productApi, taxApi, discountApi, ProductVariant } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface LineItem {
  variantId: string;
  variantName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string;
  taxRateName?: string;
  taxRate?: number;
  discountId?: string;
  discountName?: string;
  discountType?: string;
  discountValue?: number;
}

export default function CreateSubscriptionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const [step, setStep] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState('');
  
  // Form state for adding line items
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [selectedTaxId, setSelectedTaxId] = useState('');
  const [selectedDiscountId, setSelectedDiscountId] = useState('');

  const { data: usersData } = useQuery({
    queryKey: ['users', 'PORTAL'],
    queryFn: () => userApi.list({ role: 'PORTAL', limit: 100 }),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planApi.list({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.list({ limit: 100 }),
  });

  const { data: taxesData } = useQuery({
    queryKey: ['taxes'],
    queryFn: () => taxApi.list({ limit: 100 }),
  });

  const { data: discountsData } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => discountApi.list({ limit: 100 }),
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { userId: string; planId: string; notes?: string }) => {
      const response = await subscriptionApi.create(data);
      return response.data.subscription;
    },
    onSuccess: async (subscription) => {
      // Add all line items
      for (const line of lineItems) {
        await subscriptionApi.addLine(subscription.id, {
          variantId: line.variantId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRateId: line.taxRateId,
          discountId: line.discountId,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: 'Subscription created',
        description: `Subscription ${subscription.subscriptionNumber} has been created successfully.`,
        status: 'success',
        duration: 5000,
      });
      navigate(`/subscriptions/${subscription.id}`);
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

  const users = usersData?.data.items || [];
  const plans = plansData?.data.items || [];
  const products = productsData?.data.items || [];
  const taxes = taxesData?.data.items.filter(t => t.isActive) || [];
  const discounts = discountsData?.data.items.filter(d => d.isActive) || [];

  // Get all variants from all products
  const allVariants: (ProductVariant & { productName: string })[] = [];
  products.forEach(product => {
    product.variants?.forEach(variant => {
      if (variant.isActive) {
        allVariants.push({ ...variant, productName: product.name });
      }
    });
  });

  const selectedUser = users.find(u => u.id === selectedUserId);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleAddLineItem = () => {
    if (!selectedVariantId || !quantity || !unitPrice) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const variant = allVariants.find(v => v.id === selectedVariantId);
    const tax = taxes.find(t => t.id === selectedTaxId);
    const discount = discounts.find(d => d.id === selectedDiscountId);

    if (!variant) return;

    const newLine: LineItem = {
      variantId: variant.id,
      variantName: variant.name,
      productName: variant.productName,
      quantity: parseInt(quantity),
      unitPrice: parseFloat(unitPrice),
      taxRateId: tax?.id,
      taxRateName: tax?.name,
      taxRate: tax ? parseFloat(tax.rate) : undefined,
      discountId: discount?.id,
      discountName: discount?.name,
      discountType: discount?.type,
      discountValue: discount ? parseFloat(discount.value) : undefined,
    };

    setLineItems([...lineItems, newLine]);
    
    // Reset form
    setSelectedVariantId('');
    setQuantity('1');
    setUnitPrice('');
    setSelectedTaxId('');
    setSelectedDiscountId('');
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateLineTotal = (line: LineItem) => {
    let subtotal = line.quantity * line.unitPrice;
    let discount = 0;
    
    if (line.discountType === 'PERCENTAGE' && line.discountValue) {
      discount = subtotal * (line.discountValue / 100);
    } else if (line.discountType === 'FIXED' && line.discountValue) {
      discount = line.discountValue;
    }
    
    const afterDiscount = subtotal - discount;
    const tax = line.taxRate ? afterDiscount * (line.taxRate / 100) : 0;
    
    return afterDiscount + tax;
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  };

  const handleCreateSubscription = () => {
    if (lineItems.length === 0) {
      toast({
        title: 'Validation error',
        description: 'Please add at least one line item',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    createSubscriptionMutation.mutate({
      userId: selectedUserId,
      planId: selectedPlanId,
      notes: notes || undefined,
    });
  };

  const canProceedToStep2 = selectedUserId && selectedPlanId;
  const canProceedToStep3 = canProceedToStep2;
  const canProceedToStep4 = lineItems.length > 0;

  return (
    <Box>
      <Flex align="center" gap={4} className="mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate('/subscriptions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Subscription</h1>
          <p className="text-muted-foreground">Follow the steps to create a new subscription</p>
        </div>
      </Flex>

      {/* Progress Steps */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <Flex justify="space-between" align="center">
            {[1, 2, 3, 4].map((s) => (
              <Flex key={s} align="center" flex={1}>
                <Flex
                  align="center"
                  justify="center"
                  className={`w-10 h-10 rounded-full ${
                    step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s ? <Check className="h-5 w-5" /> : s}
                </Flex>
                <Box className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${step >= s ? '' : 'text-muted-foreground'}`}>
                    {s === 1 && 'Customer & Plan'}
                    {s === 2 && 'Add Products'}
                    {s === 3 && 'Add Products'}
                    {s === 4 && 'Review & Create'}
                  </p>
                </Box>
                {s < 4 && <Box className="w-12 h-0.5 bg-muted mx-2" />}
              </Flex>
            ))}
          </Flex>
        </CardContent>
      </Card>

      {/* Step 1: Select Customer & Plan */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Customer and Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <VStack spacing={6} align="stretch">
              <div>
                <Label htmlFor="customer">Customer *</Label>
                <select
                  id="customer"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Select a customer...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="plan">Recurring Plan *</Label>
                <select
                  id="plan"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  <option value="">Select a plan...</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.billingPeriod} (every {plan.intervalCount} {plan.billingPeriod.toLowerCase()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Selected Customer</p>
                    <p className="text-sm">{selectedUser.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </CardContent>
                </Card>
              )}

              {selectedPlan && (
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Selected Plan</p>
                    <p className="text-sm">{selectedPlan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Billing: {selectedPlan.billingPeriod} (every {selectedPlan.intervalCount})
                    </p>
                  </CardContent>
                </Card>
              )}

              <Flex justify="flex-end">
                <Button onClick={() => setStep(2)} disabled={!canProceedToStep2}>
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Flex>
            </VStack>
          </CardContent>
        </Card>
      )}

      {/* Step 2 & 3: Add Products (combined) */}
      {(step === 2 || step === 3) && (
        <Card>
          <CardHeader>
            <CardTitle>Add Products</CardTitle>
          </CardHeader>
          <CardContent>
            <VStack spacing={6} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <div>
                  <Label htmlFor="variant">Product Variant *</Label>
                  <select
                    id="variant"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={selectedVariantId}
                    onChange={(e) => {
                      setSelectedVariantId(e.target.value);
                      const variant = allVariants.find(v => v.id === e.target.value);
                      if (variant) {
                        setUnitPrice(variant.basePrice);
                      }
                    }}
                  >
                    <option value="">Select a product variant...</option>
                    {allVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.productName} - {variant.name} (${parseFloat(variant.basePrice).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="unitPrice">Unit Price *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="tax">Tax Rate</Label>
                  <select
                    id="tax"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={selectedTaxId}
                    onChange={(e) => setSelectedTaxId(e.target.value)}
                  >
                    <option value="">No tax</option>
                    {taxes.map((tax) => (
                      <option key={tax.id} value={tax.id}>
                        {tax.name} ({parseFloat(tax.rate).toFixed(2)}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="discount">Discount</Label>
                  <select
                    id="discount"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={selectedDiscountId}
                    onChange={(e) => setSelectedDiscountId(e.target.value)}
                  >
                    <option value="">No discount</option>
                    {discounts.map((discount) => (
                      <option key={discount.id} value={discount.id}>
                        {discount.name} ({discount.type === 'PERCENTAGE' ? `${parseFloat(discount.value).toFixed(0)}%` : `$${parseFloat(discount.value).toFixed(2)}`})
                      </option>
                    ))}
                  </select>
                </div>
              </SimpleGrid>

              <Button onClick={handleAddLineItem} variant="outline">
                Add Line Item
              </Button>

              {lineItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Line Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VStack spacing={3} align="stretch">
                      {lineItems.map((line, index) => (
                        <Flex key={index} justify="space-between" align="center" className="p-3 border rounded-md">
                          <Box flex={1}>
                            <p className="font-medium">{line.productName} - {line.variantName}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {line.quantity} × ${line.unitPrice.toFixed(2)}
                              {line.taxRateName && ` | Tax: ${line.taxRateName}`}
                              {line.discountName && ` | Discount: ${line.discountName}`}
                            </p>
                          </Box>
                          <Flex align="center" gap={3}>
                            <p className="font-semibold">${calculateLineTotal(line).toFixed(2)}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveLineItem(index)}
                            >
                              Remove
                            </Button>
                          </Flex>
                        </Flex>
                      ))}
                      <Flex justify="space-between" className="pt-3 border-t">
                        <p className="text-lg font-semibold">Total</p>
                        <p className="text-lg font-bold">${calculateTotal().toFixed(2)}</p>
                      </Flex>
                    </VStack>
                  </CardContent>
                </Card>
              )}

              <Flex justify="space-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setStep(4)} disabled={!canProceedToStep4}>
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Flex>
            </VStack>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Create */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Create</CardTitle>
          </CardHeader>
          <CardContent>
            <VStack spacing={6} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Card className="bg-muted">
                  <CardHeader>
                    <CardTitle className="text-lg">Customer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{selectedUser?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                    <Badge className="mt-2">{selectedUser?.role}</Badge>
                  </CardContent>
                </Card>

                <Card className="bg-muted">
                  <CardHeader>
                    <CardTitle className="text-lg">Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{selectedPlan?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlan?.billingPeriod} billing
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Every {selectedPlan?.intervalCount} {selectedPlan?.billingPeriod.toLowerCase()}
                    </p>
                  </CardContent>
                </Card>
              </SimpleGrid>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Line Items ({lineItems.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <VStack spacing={3} align="stretch">
                    {lineItems.map((line, index) => (
                      <Flex key={index} justify="space-between" className="pb-3 border-b last:border-0">
                        <Box>
                          <p className="font-medium">{line.productName} - {line.variantName}</p>
                          <p className="text-sm text-muted-foreground">
                            {line.quantity} × ${line.unitPrice.toFixed(2)}
                            {line.taxRateName && ` | Tax: ${line.taxRateName}`}
                            {line.discountName && ` | Discount: ${line.discountName}`}
                          </p>
                        </Box>
                        <p className="font-semibold">${calculateLineTotal(line).toFixed(2)}</p>
                      </Flex>
                    ))}
                    <Flex justify="space-between" className="pt-3 border-t">
                      <p className="text-xl font-bold">Total Amount</p>
                      <p className="text-xl font-bold text-primary">${calculateTotal().toFixed(2)}</p>
                    </Flex>
                  </VStack>
                </CardContent>
              </Card>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this subscription..."
                />
              </div>

              <Flex justify="space-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleCreateSubscription}
                  disabled={createSubscriptionMutation.isPending}
                >
                  {createSubscriptionMutation.isPending ? 'Creating...' : 'Create Subscription'}
                </Button>
              </Flex>
            </VStack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
