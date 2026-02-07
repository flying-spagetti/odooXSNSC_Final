import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, useDisclosure, useToast } from '@chakra-ui/react';
import { Package, Plus } from 'lucide-react';
import { productApi, Product } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/FormDialog';
import { ProductForm } from './components/ProductForm';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ['products', pagination],
    queryFn: () => productApi.list({ ...pagination }),
  });

  const createMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Product created',
        description: 'Product has been created successfully.',
        status: 'success',
        duration: 3000,
      });
      onClose();
      navigate(`/products/${response.data.product.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create product',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const columns: Column<Product>[] = [
    {
      header: 'Product Name',
      accessor: 'name',
      cell: (value) => <span className="font-medium">{value}</span>,
    },
    {
      header: 'Description',
      accessor: 'description',
      cell: (value) => <span className="text-muted-foreground">{value || '-'}</span>,
    },
    {
      header: 'Variants',
      accessor: (row) => row._count?.variants || 0,
      cell: (value) => <Badge variant="secondary">{value} variants</Badge>,
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
  ];

  const handleCreateProduct = (data: { name: string; description?: string; image?: File }) => {
    createMutation.mutate(data);
  };

  if (!isLoading && (!data || data.data.items.length === 0) && pagination.offset === 0) {
    return (
      <Box>
        <Flex justify="space-between" align="center" className="mb-6">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
        </Flex>
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Get started by creating your first product. Products can have multiple variants with different pricing."
          actionLabel="Create Product"
          onAction={onOpen}
        />
        <FormDialog
          isOpen={isOpen}
          onClose={onClose}
          title="Create Product"
          onSubmit={() => {}}
          hideFooter
        >
          <ProductForm
            onSubmit={handleCreateProduct}
            isLoading={createMutation.isPending}
          />
          <Box className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.querySelector('form');
                form?.requestSubmit();
              }}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Product'}
            </Button>
          </Box>
        </FormDialog>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" className="mb-6">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={onOpen}>
          <Plus className="h-4 w-4 mr-2" />
          Create Product
        </Button>
      </Flex>

      <DataTable
        columns={columns}
        data={data?.data.items || []}
        loading={isLoading}
        pagination={{
          total: data?.data.total || 0,
          limit: pagination.limit,
          offset: pagination.offset,
          onPageChange: (offset) => setPagination({ ...pagination, offset }),
        }}
        onRowClick={(row) => navigate(`/products/${row.id}`)}
      />

      <FormDialog
        isOpen={isOpen}
        onClose={onClose}
        title="Create Product"
        onSubmit={() => {}}
        hideFooter
      >
        <ProductForm
          onSubmit={handleCreateProduct}
          isLoading={createMutation.isPending}
        />
        <Box className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const form = document.querySelector('form');
              form?.requestSubmit();
            }}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Product'}
          </Button>
        </Box>
      </FormDialog>
    </Box>
  );
}
