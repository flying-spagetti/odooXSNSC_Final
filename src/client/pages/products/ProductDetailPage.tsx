import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Flex, SimpleGrid, useDisclosure, useToast } from '@chakra-ui/react';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { productApi, ProductVariant } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/DataTable';
import { FormDialog } from '@/components/FormDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { VariantForm } from './components/VariantForm';
import { ProductForm } from './components/ProductForm';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isVariantOpen, onOpen: onVariantOpen, onClose: onVariantClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.get(id!),
    enabled: !!id,
  });

  const { data: variantsData } = useQuery({
    queryKey: ['product-variants', id],
    queryFn: () => productApi.listVariants(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      productApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Product updated',
        status: 'success',
        duration: 3000,
      });
      onEditClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update product',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const createVariantMutation = useMutation({
    mutationFn: (data: { name: string; sku: string; basePrice: number; description?: string }) =>
      productApi.createVariant(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', id] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast({
        title: 'Variant created',
        status: 'success',
        duration: 3000,
      });
      onVariantClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create variant',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const updateVariantMutation = useMutation({
    mutationFn: (data: { variantId: string; updates: any }) =>
      productApi.updateVariant(id!, data.variantId, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', id] });
      toast({
        title: 'Variant updated',
        status: 'success',
        duration: 3000,
      });
      setSelectedVariant(null);
      onVariantClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update variant',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const deactivateVariantMutation = useMutation({
    mutationFn: (variantId: string) =>
      productApi.updateVariant(id!, variantId, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', id] });
      toast({
        title: 'Variant deactivated',
        status: 'success',
        duration: 3000,
      });
      onDeleteClose();
      setSelectedVariant(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to deactivate variant',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const product = productData?.data.product;
  const variants = variantsData?.data.variants || [];

  const variantColumns: Column<ProductVariant>[] = [
    {
      header: 'SKU',
      accessor: 'sku',
      cell: (value) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      header: 'Name',
      accessor: 'name',
      cell: (value) => <span className="font-medium">{value}</span>,
    },
    {
      header: 'Price',
      accessor: 'basePrice',
      cell: (value) => <span>${parseFloat(value).toFixed(2)}</span>,
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (value) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => row,
      cell: (_, row) => (
        <Flex gap={2}>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedVariant(row);
              onVariantOpen();
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedVariant(row);
              onDeleteOpen();
            }}
            disabled={!row.isActive}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </Flex>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box>
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box>
        <p className="text-center text-muted-foreground py-12">Product not found</p>
      </Box>
    );
  }

  return (
    <Box>
      <Flex align="center" gap={4} className="mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">{product.description || 'No description'}</p>
        </div>
        <Button variant="outline" onClick={onEditOpen}>
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Product
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={product.isActive ? 'default' : 'secondary'} className="text-lg">
              {product.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{variants.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {variants.filter((v) => v.isActive).length}
            </p>
          </CardContent>
        </Card>
      </SimpleGrid>

      <Card>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <div>
              <CardTitle>Product Variants</CardTitle>
              <CardDescription>Manage pricing variants for this product</CardDescription>
            </div>
            <Button onClick={() => { setSelectedVariant(null); onVariantOpen(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </Flex>
        </CardHeader>
        <CardContent>
          {variants.length > 0 ? (
            <DataTable columns={variantColumns} data={variants} />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No variants yet. Create your first variant to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <FormDialog
        isOpen={isEditOpen}
        onClose={onEditClose}
        title="Edit Product"
        hideFooter
      >
        <ProductForm
          initialData={{ name: product.name, description: product.description || '' }}
          onSubmit={(data) => updateMutation.mutate(data)}
          isLoading={updateMutation.isPending}
        />
        <Box className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onEditClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const form = document.querySelector('form');
              form?.requestSubmit();
            }}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </FormDialog>

      {/* Add/Edit Variant Dialog */}
      <FormDialog
        isOpen={isVariantOpen}
        onClose={() => { onVariantClose(); setSelectedVariant(null); }}
        title={selectedVariant ? 'Edit Variant' : 'Add Variant'}
        hideFooter
      >
        <VariantForm
          initialData={selectedVariant ? {
            name: selectedVariant.name,
            sku: selectedVariant.sku,
            basePrice: parseFloat(selectedVariant.basePrice),
            description: selectedVariant.description || '',
          } : undefined}
          onSubmit={(data) => {
            if (selectedVariant) {
              updateVariantMutation.mutate({
                variantId: selectedVariant.id,
                updates: { name: data.name, basePrice: data.basePrice, description: data.description },
              });
            } else {
              createVariantMutation.mutate(data);
            }
          }}
          isLoading={createVariantMutation.isPending || updateVariantMutation.isPending}
        />
        <Box className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => { onVariantClose(); setSelectedVariant(null); }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const form = document.querySelector('form');
              form?.requestSubmit();
            }}
            disabled={createVariantMutation.isPending || updateVariantMutation.isPending}
          >
            {(createVariantMutation.isPending || updateVariantMutation.isPending)
              ? 'Saving...'
              : selectedVariant
              ? 'Save Changes'
              : 'Create Variant'}
          </Button>
        </Box>
      </FormDialog>

      {/* Delete Variant Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => { onDeleteClose(); setSelectedVariant(null); }}
        onConfirm={() => {
          if (selectedVariant) {
            deactivateVariantMutation.mutate(selectedVariant.id);
          }
        }}
        title="Deactivate Variant"
        message={`Are you sure you want to deactivate "${selectedVariant?.name}"? This variant will no longer be available for new subscriptions.`}
        confirmText="Deactivate"
        variant="destructive"
        isLoading={deactivateVariantMutation.isPending}
      />
    </Box>
  );
}
