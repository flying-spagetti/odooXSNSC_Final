import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Flex,
  VStack,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Settings, Plus, Percent, Receipt, Calendar, FileText, Trash2 } from 'lucide-react';
import { taxApi, discountApi, planApi, templateApi, productApi, TaxRate, Discount, RecurringPlan, SubscriptionTemplate, ProductVariant } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FormDialog } from '@/components/FormDialog';
import { useAuthStore } from '@/store/authStore';

export default function ConfigurationPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  const isAdmin = user?.role === 'ADMIN';

  // ============ Tax Management ============
  const { isOpen: isTaxOpen, onOpen: onTaxOpen, onClose: onTaxClose } = useDisclosure();
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [taxDesc, setTaxDesc] = useState('');

  const { data: taxesData, isLoading: taxesLoading } = useQuery({
    queryKey: ['taxes'],
    queryFn: () => taxApi.list({ limit: 100 }),
  });

  const createTaxMutation = useMutation({
    mutationFn: (data: { name: string; rate: number; description?: string }) => taxApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast({ title: 'Tax rate created', status: 'success', duration: 3000 });
      onTaxClose();
      setTaxName('');
      setTaxRate('');
      setTaxDesc('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed', status: 'error', duration: 5000 });
    },
  });

  // ============ Discount Management ============
  const { isOpen: isDiscountOpen, onOpen: onDiscountOpen, onClose: onDiscountClose } = useDisclosure();
  const [discountName, setDiscountName] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [discountDesc, setDiscountDesc] = useState('');

  const { data: discountsData, isLoading: discountsLoading } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => discountApi.list({ limit: 100 }),
  });

  const createDiscountMutation = useMutation({
    mutationFn: (data: { name: string; type: 'PERCENTAGE' | 'FIXED'; value: number; description?: string }) =>
      discountApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast({ title: 'Discount created', status: 'success', duration: 3000 });
      onDiscountClose();
      setDiscountName('');
      setDiscountType('PERCENTAGE');
      setDiscountValue('');
      setDiscountDesc('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed', status: 'error', duration: 5000 });
    },
  });

  // ============ Plan Management ============
  const { isOpen: isPlanOpen, onOpen: onPlanOpen, onClose: onPlanClose } = useDisclosure();
  const [planName, setPlanName] = useState('');
  const [planBillingPeriod, setPlanBillingPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [planInterval, setPlanInterval] = useState('1');
  const [planDesc, setPlanDesc] = useState('');

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planApi.list({ limit: 100 }),
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: { name: string; billingPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'; intervalCount?: number; description?: string }) =>
      planApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({ title: 'Plan created', status: 'success', duration: 3000 });
      onPlanClose();
      setPlanName('');
      setPlanBillingPeriod('MONTHLY');
      setPlanInterval('1');
      setPlanDesc('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed', status: 'error', duration: 5000 });
    },
  });

  // ============ Template Management ============
  const { isOpen: isTemplateOpen, onOpen: onTemplateOpen, onClose: onTemplateClose } = useDisclosure();
  const [tplName, setTplName] = useState('');
  const [tplValidityDays, setTplValidityDays] = useState('30');
  const [tplPlanId, setTplPlanId] = useState('');
  const [tplDesc, setTplDesc] = useState('');

  // Template product lines state
  const [tplLines, setTplLines] = useState<{ variantId: string; quantity: number; unitPrice: number; discountId?: string; taxRateId?: string }[]>([]);
  const [tplVariantId, setTplVariantId] = useState('');
  const [tplQuantity, setTplQuantity] = useState('1');
  const [tplUnitPrice, setTplUnitPrice] = useState('');
  const [tplDiscountId, setTplDiscountId] = useState('');
  const [tplTaxId, setTplTaxId] = useState('');

  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateApi.list({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.list({ limit: 100 }),
  });

  const allVariants: (ProductVariant & { productName: string })[] = [];
  const productsItems = (productsData?.data as any)?.items || [];
  productsItems.forEach((product: any) => {
    product.variants?.forEach((variant: any) => {
      if (variant.isActive) {
        allVariants.push({ ...variant, productName: product.name });
      }
    });
  });

  const handleAddTplLine = () => {
    if (!tplVariantId || !tplUnitPrice) {
      toast({ title: 'Select a product and enter a price', status: 'error', duration: 3000 });
      return;
    }
    setTplLines([
      ...tplLines,
      {
        variantId: tplVariantId,
        quantity: parseInt(tplQuantity) || 1,
        unitPrice: parseFloat(tplUnitPrice),
        discountId: tplDiscountId || undefined,
        taxRateId: tplTaxId || undefined,
      },
    ]);
    setTplVariantId('');
    setTplQuantity('1');
    setTplUnitPrice('');
    setTplDiscountId('');
    setTplTaxId('');
  };

  const handleRemoveTplLine = (index: number) => {
    setTplLines(tplLines.filter((_, i) => i !== index));
  };

  const resetTemplateForm = () => {
    setTplName('');
    setTplValidityDays('30');
    setTplPlanId('');
    setTplDesc('');
    setTplLines([]);
    setTplVariantId('');
    setTplQuantity('1');
    setTplUnitPrice('');
    setTplDiscountId('');
    setTplTaxId('');
  };

  const createTemplateMutation = useMutation({
    mutationFn: (data: { name: string; validityDays: number; planId: string; description?: string; lines?: { variantId: string; quantity: number; unitPrice: number; discountId?: string; taxRateId?: string }[] }) =>
      templateApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({ title: 'Template created', status: 'success', duration: 3000 });
      onTemplateClose();
      resetTemplateForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed', status: 'error', duration: 5000 });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => templateApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({ title: 'Template deleted', status: 'success', duration: 3000 });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed', status: 'error', duration: 5000 });
    },
  });

  // Table columns
  const taxColumns: Column<TaxRate>[] = [
    { header: 'Name', accessor: 'name', cell: (v) => <span className="font-medium">{v}</span> },
    { header: 'Rate', accessor: 'rate', cell: (v) => <span>{parseFloat(v).toFixed(2)}%</span> },
    { header: 'Description', accessor: 'description', cell: (v) => <span className="text-sm text-muted-foreground">{v || '-'}</span> },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (v) => <Badge className={v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  const discountColumns: Column<Discount>[] = [
    { header: 'Name', accessor: 'name', cell: (v) => <span className="font-medium">{v}</span> },
    {
      header: 'Type',
      accessor: 'type',
      cell: (v) => <Badge variant="outline">{v}</Badge>,
    },
    {
      header: 'Value',
      accessor: (row) => row,
      cell: (_v, row) => (
        <span>{row.type === 'PERCENTAGE' ? `${parseFloat(row.value).toFixed(0)}%` : `$${parseFloat(row.value).toFixed(2)}`}</span>
      ),
    },
    { header: 'Description', accessor: 'description', cell: (v) => <span className="text-sm text-muted-foreground">{v || '-'}</span> },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (v) => <Badge className={v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  const planColumns: Column<RecurringPlan>[] = [
    { header: 'Name', accessor: 'name', cell: (v) => <span className="font-medium">{v}</span> },
    {
      header: 'Billing Period',
      accessor: 'billingPeriod',
      cell: (v) => <Badge variant="outline">{v}</Badge>,
    },
    { header: 'Interval', accessor: 'intervalCount', cell: (v) => <span>Every {v}</span> },
    { header: 'Description', accessor: 'description', cell: (v) => <span className="text-sm text-muted-foreground">{v || '-'}</span> },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (v) => <Badge className={v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  const templateColumns: Column<SubscriptionTemplate>[] = [
    { header: 'Name', accessor: 'name', cell: (v) => <span className="font-medium">{v}</span> },
    { header: 'Validity', accessor: 'validityDays', cell: (v) => <span>{v} days</span> },
    {
      header: 'Recurring Plan',
      accessor: (row) => row.plan?.name,
      cell: (v) => <Badge variant="outline">{v || '-'}</Badge>,
    },
    {
      header: 'Product Lines',
      accessor: (row) => row.lines?.length ?? 0,
      cell: (v) => <span>{v} line(s)</span>,
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (v) => <Badge className={v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      header: '',
      accessor: (row) => row,
      cell: (_v, row) =>
        isAdmin ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              deleteTemplateMutation.mutate(row.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null,
    },
  ];

  const taxes = (taxesData?.data as any)?.items || [];
  const discounts = (discountsData?.data as any)?.items || [];
  const plans = (plansData?.data as any)?.items || [];
  const templates = (templatesData?.data as any)?.items || [];

  return (
    <Box className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configuration
        </h1>
        <p className="text-muted-foreground">Manage tax rates, discounts, and recurring plans</p>
      </div>

      <Tabs>
        <TabList>
          <Tab fontWeight="semibold">
            <Flex align="center" gap={2}>
              <Receipt className="h-4 w-4" />
              Tax Rates
            </Flex>
          </Tab>
          <Tab fontWeight="semibold">
            <Flex align="center" gap={2}>
              <Percent className="h-4 w-4" />
              Discounts
            </Flex>
          </Tab>
          <Tab fontWeight="semibold">
            <Flex align="center" gap={2}>
              <Calendar className="h-4 w-4" />
              Recurring Plans
            </Flex>
          </Tab>
          <Tab fontWeight="semibold">
            <Flex align="center" gap={2}>
              <FileText className="h-4 w-4" />
              Subscription Templates
            </Flex>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Tax Rates Tab */}
          <TabPanel px={0}>
            <Flex justify="space-between" align="center" className="mb-4">
              <p className="text-sm text-muted-foreground">{taxes.length} tax rate(s)</p>
              {isAdmin && (
                <Button size="sm" onClick={onTaxOpen}>
                  <Plus className="h-4 w-4 mr-1" /> Add Tax Rate
                </Button>
              )}
            </Flex>
            <DataTable columns={taxColumns} data={taxes} loading={taxesLoading} />
          </TabPanel>

          {/* Discounts Tab */}
          <TabPanel px={0}>
            <Flex justify="space-between" align="center" className="mb-4">
              <p className="text-sm text-muted-foreground">{discounts.length} discount(s)</p>
              {isAdmin && (
                <Button size="sm" onClick={onDiscountOpen}>
                  <Plus className="h-4 w-4 mr-1" /> Add Discount
                </Button>
              )}
            </Flex>
            <DataTable columns={discountColumns} data={discounts} loading={discountsLoading} />
          </TabPanel>

          {/* Plans Tab */}
          <TabPanel px={0}>
            <Flex justify="space-between" align="center" className="mb-4">
              <p className="text-sm text-muted-foreground">{plans.length} plan(s)</p>
              {isAdmin && (
                <Button size="sm" onClick={onPlanOpen}>
                  <Plus className="h-4 w-4 mr-1" /> Add Plan
                </Button>
              )}
            </Flex>
            <DataTable columns={planColumns} data={plans} loading={plansLoading} />
          </TabPanel>

          {/* Templates Tab */}
          <TabPanel px={0}>
            <Flex justify="space-between" align="center" className="mb-4">
              <p className="text-sm text-muted-foreground">{templates.length} template(s)</p>
              {isAdmin && (
                <Button size="sm" onClick={onTemplateOpen}>
                  <Plus className="h-4 w-4 mr-1" /> Add Template
                </Button>
              )}
            </Flex>
            <DataTable columns={templateColumns} data={templates} loading={templatesLoading} />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Create Tax Dialog */}
      <FormDialog
        isOpen={isTaxOpen}
        onClose={onTaxClose}
        title="Add Tax Rate"
        onSubmit={() => {
          if (!taxName || !taxRate) return;
          createTaxMutation.mutate({ name: taxName, rate: parseFloat(taxRate), description: taxDesc || undefined });
        }}
        submitText="Create"
        isLoading={createTaxMutation.isPending}
      >
        <VStack spacing={4} align="stretch">
          <div>
            <Label htmlFor="taxName">Name *</Label>
            <Input id="taxName" value={taxName} onChange={(e) => setTaxName(e.target.value)} placeholder="e.g. GST 18%" required />
          </div>
          <div>
            <Label htmlFor="taxRate">Rate (%) *</Label>
            <Input id="taxRate" type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="e.g. 18.00" required />
          </div>
          <div>
            <Label htmlFor="taxDesc">Description</Label>
            <Input id="taxDesc" value={taxDesc} onChange={(e) => setTaxDesc(e.target.value)} placeholder="Optional description" />
          </div>
        </VStack>
      </FormDialog>

      {/* Create Discount Dialog */}
      <FormDialog
        isOpen={isDiscountOpen}
        onClose={onDiscountClose}
        title="Add Discount"
        onSubmit={() => {
          if (!discountName || !discountValue) return;
          createDiscountMutation.mutate({
            name: discountName,
            type: discountType,
            value: parseFloat(discountValue),
            description: discountDesc || undefined,
          });
        }}
        submitText="Create"
        isLoading={createDiscountMutation.isPending}
      >
        <VStack spacing={4} align="stretch">
          <div>
            <Label htmlFor="discountName">Name *</Label>
            <Input id="discountName" value={discountName} onChange={(e) => setDiscountName(e.target.value)} placeholder="e.g. 10% Off" required />
          </div>
          <div>
            <Label htmlFor="discountType">Type *</Label>
            <select id="discountType" className="w-full mt-1 px-3 py-2 border rounded-md" value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed ($)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="discountValue">Value *</Label>
            <Input id="discountValue" type="number" step="0.01" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 50.00'} required />
          </div>
          <div>
            <Label htmlFor="discountDesc">Description</Label>
            <Input id="discountDesc" value={discountDesc} onChange={(e) => setDiscountDesc(e.target.value)} placeholder="Optional description" />
          </div>
        </VStack>
      </FormDialog>

      {/* Create Plan Dialog */}
      <FormDialog
        isOpen={isPlanOpen}
        onClose={onPlanClose}
        title="Add Recurring Plan"
        onSubmit={() => {
          if (!planName) return;
          createPlanMutation.mutate({
            name: planName,
            billingPeriod: planBillingPeriod,
            intervalCount: parseInt(planInterval) || 1,
            description: planDesc || undefined,
          });
        }}
        submitText="Create"
        isLoading={createPlanMutation.isPending}
      >
        <VStack spacing={4} align="stretch">
          <div>
            <Label htmlFor="planName">Name *</Label>
            <Input id="planName" value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Monthly Plan" required />
          </div>
          <div>
            <Label htmlFor="planBillingPeriod">Billing Period *</Label>
            <select id="planBillingPeriod" className="w-full mt-1 px-3 py-2 border rounded-md" value={planBillingPeriod} onChange={(e) => setPlanBillingPeriod(e.target.value as any)}>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
          <div>
            <Label htmlFor="planInterval">Interval Count</Label>
            <Input id="planInterval" type="number" min="1" value={planInterval} onChange={(e) => setPlanInterval(e.target.value)} placeholder="e.g. 1 = every period" />
            <p className="text-xs text-muted-foreground mt-1">e.g. 2 with Monthly = every 2 months</p>
          </div>
          <div>
            <Label htmlFor="planDesc">Description</Label>
            <Input id="planDesc" value={planDesc} onChange={(e) => setPlanDesc(e.target.value)} placeholder="Optional description" />
          </div>
        </VStack>
      </FormDialog>

      {/* Create Template Dialog */}
      <FormDialog
        isOpen={isTemplateOpen}
        onClose={() => { onTemplateClose(); resetTemplateForm(); }}
        title="Add Subscription Template"
        size="xl"
        onSubmit={() => {
          if (!tplName || !tplPlanId) {
            toast({ title: 'Template name and plan are required', status: 'error', duration: 3000 });
            return;
          }
          createTemplateMutation.mutate({
            name: tplName,
            validityDays: parseInt(tplValidityDays) || 30,
            planId: tplPlanId,
            description: tplDesc || undefined,
            lines: tplLines.length > 0 ? tplLines : undefined,
          });
        }}
        submitText="Create Template"
        isLoading={createTemplateMutation.isPending}
      >
        <VStack spacing={5} align="stretch">
          {/* Template basic fields */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <div>
              <Label htmlFor="tplName">Template Name *</Label>
              <Input id="tplName" value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g. Starter Package" required />
            </div>
            <div>
              <Label htmlFor="tplValidityDays">Validity Days *</Label>
              <Input id="tplValidityDays" type="number" min="1" value={tplValidityDays} onChange={(e) => setTplValidityDays(e.target.value)} placeholder="30" required />
              <p className="text-xs text-muted-foreground mt-1">Number of days the subscription offer is valid</p>
            </div>
            <div>
              <Label htmlFor="tplPlanId">Recurring Plan *</Label>
              <select id="tplPlanId" className="w-full mt-1 px-3 py-2 border rounded-md" value={tplPlanId} onChange={(e) => setTplPlanId(e.target.value)}>
                <option value="">Select a plan...</option>
                {plans.map((plan: any) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {plan.billingPeriod} (every {plan.intervalCount})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="tplDesc">Description</Label>
              <Input id="tplDesc" value={tplDesc} onChange={(e) => setTplDesc(e.target.value)} placeholder="Optional description" />
            </div>
          </SimpleGrid>

          {/* Product Lines */}
          <Box>
            <Label className="text-sm font-semibold mb-2 block">Product Lines</Label>
            <Box className="border rounded-md p-3 space-y-3">
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                <div>
                  <Label htmlFor="tplVariant" className="text-xs">Product *</Label>
                  <select
                    id="tplVariant"
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                    value={tplVariantId}
                    onChange={(e) => {
                      setTplVariantId(e.target.value);
                      const v = allVariants.find((x) => x.id === e.target.value);
                      if (v) setTplUnitPrice(v.basePrice);
                    }}
                  >
                    <option value="">Select a product...</option>
                    {allVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.productName} - {v.name} (${parseFloat(v.basePrice).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="tplQty" className="text-xs">Quantity</Label>
                  <Input id="tplQty" type="number" min="1" value={tplQuantity} onChange={(e) => setTplQuantity(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="tplPrice" className="text-xs">Unit Price *</Label>
                  <Input id="tplPrice" type="number" step="0.01" min="0" value={tplUnitPrice} onChange={(e) => setTplUnitPrice(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="tplDiscount" className="text-xs">Discount</Label>
                  <select id="tplDiscount" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" value={tplDiscountId} onChange={(e) => setTplDiscountId(e.target.value)}>
                    <option value="">No discount</option>
                    {discounts.filter((d: any) => d.isActive).map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.type === 'PERCENTAGE' ? `${parseFloat(d.value).toFixed(0)}%` : `$${parseFloat(d.value).toFixed(2)}`})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="tplTax" className="text-xs">Tax</Label>
                  <select id="tplTax" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" value={tplTaxId} onChange={(e) => setTplTaxId(e.target.value)}>
                    <option value="">No tax</option>
                    {taxes.filter((t: any) => t.isActive).map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({parseFloat(t.rate).toFixed(2)}%)
                      </option>
                    ))}
                  </select>
                </div>
                <Flex align="end">
                  <Button type="button" onClick={handleAddTplLine} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-1" /> Add Line
                  </Button>
                </Flex>
              </SimpleGrid>

              {/* Current template lines list */}
              {tplLines.length > 0 && (
                <Box className="overflow-x-auto border rounded-md mt-3">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Product</Th>
                        <Th isNumeric>Qty</Th>
                        <Th isNumeric>Unit Price</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {tplLines.map((line, idx) => {
                        const variant = allVariants.find((v) => v.id === line.variantId);
                        return (
                          <Tr key={idx}>
                            <Td className="text-sm">{variant ? `${variant.productName} - ${variant.name}` : line.variantId}</Td>
                            <Td isNumeric className="text-sm">{line.quantity}</Td>
                            <Td isNumeric className="text-sm">${line.unitPrice.toFixed(2)}</Td>
                            <Td>
                              <Button type="button" size="sm" variant="ghost" className="text-red-500" onClick={() => handleRemoveTplLine(idx)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              )}

              {tplLines.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-3">No product lines yet. Add products above.</p>
              )}
            </Box>
          </Box>
        </VStack>
      </FormDialog>
    </Box>
  );
}
