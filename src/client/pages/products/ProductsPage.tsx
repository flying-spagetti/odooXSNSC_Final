import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, useDisclosure, useToast, SimpleGrid, Image, Text as ChakraText } from '@chakra-ui/react';
import { Plus, List, LayoutGrid } from 'lucide-react';
import { productApi, Product } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/FormDialog';
import { ProductForm } from './components/ProductForm';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/utils';

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

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
        <Flex gap={2} align="center">
          <Flex gap={1} className="border rounded-md p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-8"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </Flex>
          <Button onClick={onOpen}>
            <Plus className="h-4 w-4 mr-2" />
            Create Product
          </Button>
        </Flex>
      </Flex>

      {viewMode === 'list' ? (
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
      ) : (
        <Box>
          {isLoading ? (
            <Box textAlign="center" py={12}>
              <ChakraText color="gray.500">Loading products...</ChakraText>
            </Box>
          ) : data?.data.items && data.data.items.length === 0 ? (
            <Box textAlign="center" py={12}>
              <ChakraText color="gray.500">No products found</ChakraText>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
              {data?.data.items.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-xl transition-all duration-200 border border-gray-200 overflow-hidden group"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <Box
                    height="200px"
                    overflow="hidden"
                    position="relative"
                    className="bg-gray-100"
                  >
                    <Image
                      src={product.imageUrl || DEFAULT_PRODUCT_IMAGE}
                      alt={product.name}
                      width="100%"
                      height="200px"
                      objectFit="cover"
                      className="group-hover:scale-105 transition-transform duration-200"
                    />
                  </Box>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold line-clamp-1">
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ChakraText 
                      fontSize="sm" 
                      color="gray.600" 
                      noOfLines={2} 
                      mb={4}
                      className="min-h-[2.5rem]"
                    >
                      {product.description || 'No description available'}
                    </ChakraText>
                    <Flex justify="space-between" align="center" className="pt-3 border-t border-gray-100">
                      <Badge variant="secondary" className="text-xs">
                        {product._count?.variants || 0} {product._count?.variants === 1 ? 'variant' : 'variants'}
                      </Badge>
                      <Badge 
                        variant={product.isActive ? 'default' : 'secondary'}
                        className={product.isActive ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Flex>
                  </CardContent>
                </Card>
              ))}
            </SimpleGrid>
          )}
          {data && data.data.total > pagination.limit && (
            <Flex justify="center" gap={2} mt={6}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                disabled={pagination.offset === 0}
              >
                Previous
              </Button>
              <ChakraText fontSize="sm" alignSelf="center">
                Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(data.data.total / pagination.limit)}
              </ChakraText>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                disabled={pagination.offset + pagination.limit >= data.data.total}
              >
                Next
              </Button>
            </Flex>
          )}
        </Box>
      )}

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
