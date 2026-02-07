import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Flex,
  VStack,
  SimpleGrid,
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
import { ArrowLeft, Plus, Send, Check, TrendingUp } from 'lucide-react';
import { subscriptionApi, planApi, userApi, productApi, taxApi, discountApi, templateApi, ProductVariant } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';

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
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user: currentUser } = useAuthStore();

  // Read upsell pre-fill params from URL
  const upsellFromId = searchParams.get('upsellFrom');
  const prefillUserId = searchParams.get('userId');
  const prefillPlanId = searchParams.get('planId');

  // Main form state
  const [selectedUserId, setSelectedUserId] = useState(prefillUserId || '');
  const [selectedPlanId, setSelectedPlanId] = useState(prefillPlanId || '');
  const [quotationTemplate, setQuotationTemplate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [paymentTermDays, setPaymentTermDays] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [salespersonId, setSalespersonId] = useState('');
  const [paymentDone, setPaymentDone] = useState(false);
  const [notes, setNotes] = useState('');

  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Form state for adding line items
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [selectedTaxId, setSelectedTaxId] = useState('');
  const [selectedDiscountId, setSelectedDiscountId] = useState('');

  // Queries
  const { data: usersData } = useQuery({
    queryKey: ['users', 'PORTAL'],
    queryFn: () => userApi.list({ role: 'PORTAL', limit: 100 }),
  });

  const { data: salespersonsData } = useQuery({
    queryKey: ['users', 'salespersons'],
    queryFn: () => userApi.list({ limit: 100 }),
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

  const { data: templatesData } = useQuery({
    queryKey: ['templates', 'active'],
    queryFn: () => templateApi.list({ isActive: true, limit: 100 }),
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      planId: string;
      notes?: string;
      quotationTemplate?: string;
      expirationDate?: string;
      paymentTermDays?: number;
      paymentMethod?: string;
      salespersonId?: string;
    }) => {
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

      // Update payment done if checked
      if (paymentDone) {
        await subscriptionApi.update(subscription.id, { paymentDone: true });
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

  const users = usersData?.data?.items || [];
  const salespersons = (salespersonsData?.data?.items || []).filter(
    (u: any) => u.role === 'ADMIN' || u.role === 'INTERNAL'
  );
  const plans = plansData?.data?.items || [];
  const products = productsData?.data?.items || [];
  const taxes = (taxesData?.data?.items || []).filter((t: any) => t.isActive);
  const discounts = (discountsData?.data?.items || []).filter((d: any) => d.isActive);
  const templates = (templatesData?.data as any)?.items || [];

  // Get all variants from all products
  const allVariants: (ProductVariant & { productName: string })[] = [];
  products.forEach((product: any) => {
    product.variants?.forEach((variant: any) => {
      if (variant.isActive) {
        allVariants.push({ ...variant, productName: product.name });
      }
    });
  });

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

    const variant = allVariants.find((v) => v.id === selectedVariantId);
    const tax = taxes.find((t: any) => t.id === selectedTaxId);
    const discount = discounts.find((d: any) => d.id === selectedDiscountId);

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

  /**
   * Apply a predefined template to pre-fill the form
   */
  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find((t: any) => t.id === templateId);
    if (!template) return;

    // Set the plan
    if (template.planId) {
      setSelectedPlanId(template.planId);
    }

    // Set expiration date based on validity days
    if (template.validityDays) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + template.validityDays);
      setExpirationDate(expDate.toISOString().split('T')[0]);
    }

    // Set quotation template name
    if (template.name) {
      setQuotationTemplate(template.name);
    }

    // Build line items from template lines
    if (template.lines && template.lines.length > 0) {
      const newLines: LineItem[] = template.lines.map((tLine: any) => {
        const variant = tLine.variant;
        const taxRate = tLine.taxRate;
        const discount = tLine.discount;
        return {
          variantId: tLine.variantId,
          variantName: variant?.name || 'Unknown',
          productName: variant?.product?.name || 'Unknown',
          quantity: tLine.quantity,
          unitPrice: parseFloat(tLine.unitPrice),
          taxRateId: taxRate?.id,
          taxRateName: taxRate?.name,
          taxRate: taxRate ? parseFloat(taxRate.rate) : undefined,
          discountId: discount?.id,
          discountName: discount?.name,
          discountType: discount?.type,
          discountValue: discount ? parseFloat(discount.value) : undefined,
        };
      });
      setLineItems(newLines);
    }

    toast({
      title: 'Template applied',
      description: `"${template.name}" template has been applied. Review and adjust as needed.`,
      status: 'info',
      duration: 4000,
    });
  };

  const handleCreateSubscription = () => {
    if (!selectedUserId || !selectedPlanId) {
      toast({
        title: 'Validation error',
        description: 'Please select a customer and a plan',
        status: 'error',
        duration: 3000,
      });
      return;
    }
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
      quotationTemplate: quotationTemplate || undefined,
      expirationDate: expirationDate || undefined,
      paymentTermDays: paymentTermDays ? parseInt(paymentTermDays) : undefined,
      paymentMethod: paymentMethod || undefined,
      salespersonId: salespersonId || undefined,
    });
  };

  return (
    <Box>
      {/* Back button */}
      <Flex align="center" gap={4} className="mb-4">
        <Button variant="outline" size="sm" onClick={() => upsellFromId ? navigate(`/subscriptions/${upsellFromId}`) : navigate('/subscriptions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{upsellFromId ? 'Upsell — New Subscription' : 'Create Subscription'}</h1>
          {upsellFromId && (
            <p className="text-sm text-muted-foreground">Upgrade or change products for the customer</p>
          )}
        </div>
      </Flex>

      {upsellFromId && (
        <Box className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm font-medium">
            <TrendingUp className="h-4 w-4 inline mr-1" />
            This is an upsell from an existing subscription. Customer and plan have been pre-filled. Choose new or upgraded products below.
          </p>
        </Box>
      )}

      {/* Template Selector */}
      {templates.length > 0 && (
        <Flex
          align="center"
          gap={3}
          className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <span className="text-sm font-medium text-blue-800 whitespace-nowrap">Quick Start:</span>
          <select
            className="flex-1 px-3 py-2 border border-blue-300 rounded-md text-sm bg-white"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                handleApplyTemplate(e.target.value);
                e.target.value = '';
              }
            }}
          >
            <option value="">Choose a template to pre-fill the form...</option>
            {templates.map((tpl: any) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} — {tpl.plan?.name || 'No plan'} ({tpl.validityDays} days, {tpl.lines?.length || 0} product line(s))
              </option>
            ))}
          </select>
        </Flex>
      )}

      {/* Top toolbar */}
      <Flex
        justify="space-between"
        align="center"
        className="mb-4 p-3 bg-white border rounded-lg shadow-sm"
        gap={2}
      >
        <Flex gap={2}>
          <Button size="sm" variant="outline" onClick={() => navigate('/subscriptions/new')}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
          <Button
            size="sm"
            onClick={handleCreateSubscription}
            disabled={createSubscriptionMutation.isPending}
          >
            <Check className="h-4 w-4 mr-1" />
            {createSubscriptionMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </Flex>

        {/* Status badges (always starts at Draft) */}
        <Flex gap={2} align="center">
          <Badge variant="outline" className="border-primary text-primary border-dashed border-2">
            Quotation
          </Badge>
          <Badge variant="outline">quotation sent</Badge>
          <Badge variant="outline">confirmed</Badge>
        </Flex>
      </Flex>

      {/* Subscription Number (auto-generated) */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-muted-foreground">Subscription number (auto-generated)</h2>
          </div>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {/* Left column */}
            <VStack spacing={4} align="stretch">
              <div>
                <Label htmlFor="customer" className="text-sm font-semibold">Customer *</Label>
                <select
                  id="customer"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Select a customer...</option>
                  {users.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="quotationTemplate" className="text-sm font-semibold">Quotation Template</Label>
                <Input
                  id="quotationTemplate"
                  value={quotationTemplate}
                  onChange={(e) => setQuotationTemplate(e.target.value)}
                  placeholder="Enter template name..."
                />
              </div>
            </VStack>

            {/* Right column */}
            <VStack spacing={4} align="stretch">
              <div>
                <Label htmlFor="expiration" className="text-sm font-semibold">Expiration</Label>
                <Input
                  id="expiration"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="plan" className="text-sm font-semibold">Recurring Plan *</Label>
                <select
                  id="plan"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  <option value="">Select a plan...</option>
                  {plans.map((plan: any) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.billingPeriod} (every {plan.intervalCount})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="paymentTerm" className="text-sm font-semibold">Payment Term</Label>
                <Input
                  id="paymentTerm"
                  type="number"
                  placeholder="e.g. 30 days"
                  value={paymentTermDays}
                  onChange={(e) => setPaymentTermDays(e.target.value)}
                />
              </div>
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
            <TabPanel>
              {/* Add line item form */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} className="mb-4">
                <div>
                  <Label htmlFor="variant">Product *</Label>
                  <select
                    id="variant"
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                    value={selectedVariantId}
                    onChange={(e) => {
                      setSelectedVariantId(e.target.value);
                      const variant = allVariants.find((v) => v.id === e.target.value);
                      if (variant) {
                        setUnitPrice(variant.basePrice);
                      }
                    }}
                  >
                    <option value="">Select a product...</option>
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
                  <Label htmlFor="discount">Discount</Label>
                  <select
                    id="discount"
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                    value={selectedDiscountId}
                    onChange={(e) => setSelectedDiscountId(e.target.value)}
                  >
                    <option value="">No discount</option>
                    {discounts.map((discount: any) => (
                      <option key={discount.id} value={discount.id}>
                        {discount.name} ({discount.type === 'PERCENTAGE' ? `${parseFloat(discount.value).toFixed(0)}%` : `$${parseFloat(discount.value).toFixed(2)}`})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="tax">Taxes</Label>
                  <select
                    id="tax"
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                    value={selectedTaxId}
                    onChange={(e) => setSelectedTaxId(e.target.value)}
                  >
                    <option value="">No tax</option>
                    {taxes.map((tax: any) => (
                      <option key={tax.id} value={tax.id}>
                        {tax.name} ({parseFloat(tax.rate).toFixed(2)}%)
                      </option>
                    ))}
                  </select>
                </div>
                <Flex align="end">
                  <Button onClick={handleAddLineItem} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-1" /> Add Line
                  </Button>
                </Flex>
              </SimpleGrid>

              {/* Line items table */}
              {lineItems.length > 0 ? (
                <Box className="overflow-x-auto border rounded-md">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Product</Th>
                        <Th isNumeric>Quantity</Th>
                        <Th isNumeric>Unit Price</Th>
                        <Th isNumeric>Discount</Th>
                        <Th isNumeric>Taxes</Th>
                        <Th isNumeric>Amount</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {lineItems.map((line, index) => (
                        <Tr key={index}>
                          <Td>
                            <span className="font-medium">{line.productName} - {line.variantName}</span>
                          </Td>
                          <Td isNumeric>{line.quantity}</Td>
                          <Td isNumeric>${line.unitPrice.toFixed(2)}</Td>
                          <Td isNumeric>
                            {line.discountName
                              ? line.discountType === 'PERCENTAGE'
                                ? `${line.discountValue?.toFixed(0)}%`
                                : `$${line.discountValue?.toFixed(2)}`
                              : '-'}
                          </Td>
                          <Td isNumeric>
                            {line.taxRateName
                              ? `${line.taxRateName} (${line.taxRate?.toFixed(0)}%)`
                              : '-'}
                          </Td>
                          <Td isNumeric className="font-semibold">
                            ${calculateLineTotal(line).toFixed(2)}
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveLineItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  <Flex justify="flex-end" className="p-4 border-t" gap={8}>
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                  </Flex>
                </Box>
              ) : (
                <p className="text-center text-muted-foreground py-8 border rounded-md">
                  No order lines yet. Use the form above to add products.
                </p>
              )}
            </TabPanel>

            {/* Other Info Tab */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} className="p-2">
                <VStack spacing={4} align="stretch">
                  <div>
                    <Label htmlFor="salesperson" className="text-sm font-semibold">Salesperson</Label>
                    <select
                      id="salesperson"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      value={salespersonId}
                      onChange={(e) => setSalespersonId(e.target.value)}
                    >
                      <option value="">
                        {currentUser?.name || 'Current user'} (default)
                      </option>
                      {salespersons.map((sp: any) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name} ({sp.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      By default the login user is assigned as the Sales person. However only admin can change the Sales person.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod" className="text-sm font-semibold">Payment Method</Label>
                    <select
                      id="paymentMethod"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="">Select payment method...</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="CASH">Cash</option>
                      <option value="CHECK">Check</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Which payment method is used for payment. It should be updated after payment is done.
                    </p>
                  </div>
                </VStack>

                <VStack spacing={4} align="stretch">
                  <div>
                    <Label className="text-sm font-semibold">Start Date</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      By default the day on which the quotation is confirmed will populate here. However this can be editable.
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Payment Done</Label>
                    <Flex align="center" gap={2} className="mt-1">
                      <Checkbox
                        isChecked={paymentDone}
                        onChange={(e) => setPaymentDone(e.target.checked)}
                      />
                      <span className="text-sm">{paymentDone ? 'Yes' : 'No'}</span>
                    </Flex>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this subscription..."
                    />
                  </div>
                </VStack>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Card>

      {/* Create button at bottom */}
      <Flex justify="flex-end" className="mt-4">
        <Button
          onClick={handleCreateSubscription}
          disabled={createSubscriptionMutation.isPending || !selectedUserId || !selectedPlanId || lineItems.length === 0}
          size="lg"
        >
          {createSubscriptionMutation.isPending ? 'Creating...' : 'Create Subscription'}
        </Button>
      </Flex>
    </Box>
  );
}
