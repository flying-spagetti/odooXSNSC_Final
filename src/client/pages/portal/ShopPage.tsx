import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Heading,
  Text,
  Button,
  Badge,
  useToast,
  Image,
  Text as ChakraText,
} from '@chakra-ui/react';
import { Search, Filter, List, LayoutGrid } from 'lucide-react';
import { productApi, Product, ProductVariant } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/DataTable';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/utils';

export default function ShopPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'shop'],
    queryFn: () => productApi.list({ limit: 100 }),
  });

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!data?.data.items) return [];
    
    let filtered = data.data.items.filter((p) => p.isActive);

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter (using product name for now - can be enhanced later)
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.name === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      // Add more sort options as needed
      return 0;
    });

    return filtered;
  }, [data, searchQuery, selectedCategory, priceRange, sortBy]);

  // Get unique categories from products (using product names as categories for now)
  const categories = useMemo(() => {
    if (!data?.data.items) return [];
    return Array.from(new Set(data.data.items.map((p) => p.name))).sort();
  }, [data]);

  const handleProductClick = (productId: string) => {
    navigate(`/portal/products/${productId}`);
  };

  if (isLoading) {
    return (
      <Box>
        <Text>Loading products...</Text>
      </Box>
    );
  }

  const productColumns: Column<Product>[] = [
    {
      header: 'Product',
      accessor: 'name',
      cell: (value, row) => (
        <Flex align="center" gap={3}>
          <Box width="50px" height="50px" borderRadius="md" overflow="hidden" className="bg-gray-100">
            <Image
              src={row.imageUrl || DEFAULT_PRODUCT_IMAGE}
              alt={value}
              width="50px"
              height="50px"
              objectFit="cover"
            />
          </Box>
          <div>
            <Text fontWeight="semibold">{value}</Text>
            <Text fontSize="xs" color="gray.500" noOfLines={1}>
              {row.description || 'No description'}
            </Text>
          </div>
        </Flex>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      cell: (value) => <ChakraText fontSize="sm" color="gray.600" noOfLines={2}>{value || '-'}</ChakraText>,
    },
    {
      header: 'Variants',
      accessor: (row) => row._count?.variants || 0,
      cell: (value) => <Badge variant="secondary">{value} {value === 1 ? 'variant' : 'variants'}</Badge>,
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (value) => (
        <Badge variant={value ? 'default' : 'secondary'} className={value ? 'bg-green-100 text-green-700' : ''}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">
          All Products
        </Heading>
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
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            width="200px"
            size="sm"
          >
            <option value="name">Sort By Name</option>
            <option value="price">Sort By Price</option>
          </Select>
        </Flex>
      </Flex>

      <Flex gap={6}>
        {/* Left Sidebar - Filters */}
        <Box width="250px" display={{ base: 'none', md: 'block' }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VStack spacing={4} align="stretch">
                {/* Category Filter */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Category
                  </Text>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    size="sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                </Box>

                {/* Price Range Filter */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Price Range
                  </Text>
                  <Select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    size="sm"
                  >
                    <option value="all">All Prices</option>
                    <option value="0-100">₹0 - ₹100</option>
                    <option value="100-500">₹100 - ₹500</option>
                    <option value="500-1000">₹500 - ₹1,000</option>
                    <option value="1000+">₹1,000+</option>
                  </Select>
                </Box>
              </VStack>
            </CardContent>
          </Card>
        </Box>

        {/* Main Content - Product Grid */}
        <Box flex={1}>
          {/* Search Bar */}
          <HStack mb={6}>
            <Box position="relative" flex={1}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                pl={10}
                size="md"
              />
            </Box>
          </HStack>

          {/* Product Type Selector */}
          <Select
            value="all"
            mb={6}
            width="200px"
            size="sm"
          >
            <option value="all">Product Type</option>
          </Select>

          {/* Product Display */}
          {filteredProducts.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text color="gray.500">No products found</Text>
            </Box>
          ) : viewMode === 'list' ? (
            <Card>
              <CardContent className="p-0">
                <DataTable
                  columns={productColumns}
                  data={filteredProducts}
                  loading={isLoading}
                  onRowClick={(row) => handleProductClick(row.id)}
                />
              </CardContent>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-xl transition-all duration-200 border border-gray-200 overflow-hidden group"
                  onClick={() => handleProductClick(product.id)}
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
                    <Button 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(product.id);
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
