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
  Card,
  CardBody,
  Heading,
  Text,
  Button,
  Badge,
  useToast,
  Image,
} from '@chakra-ui/react';
import { Search, Filter } from 'lucide-react';
import { productApi, Product, ProductVariant } from '@/lib/api';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShopPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

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

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">
          All Products
        </Heading>
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
                    <option value="0-100">$0 - $100</option>
                    <option value="100-500">$100 - $500</option>
                    <option value="500-1000">$500 - $1,000</option>
                    <option value="1000+">$1,000+</option>
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

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text color="gray.500">No products found</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  cursor="pointer"
                  onClick={() => handleProductClick(product.id)}
                  _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                      {product.imageUrl ? (
                        <Box
                          height="200px"
                          borderRadius="md"
                          overflow="hidden"
                        >
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width="100%"
                            height="200px"
                            objectFit="cover"
                          />
                        </Box>
                      ) : (
                        <Box
                          height="200px"
                          bg="gray.100"
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="gray.400">No Image</Text>
                        </Box>
                      )}
                      <Heading size="sm">{product.name}</Heading>
                      <Text fontSize="sm" color="gray.600" noOfLines={2}>
                        {product.description || 'No description available'}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="primary">
                        Price / Billing
                      </Text>
                      <Button size="sm" colorScheme="blue">
                        View Details
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
