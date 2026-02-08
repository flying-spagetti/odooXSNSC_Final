import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Image,
  Text as ChakraText,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { ShoppingBag, FileText, Package, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { subscriptionApi, invoiceApi, productApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/utils';

export default function HomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Fetch user's subscriptions (orders)
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['subscriptions', 'home', user?.id],
    queryFn: () => subscriptionApi.list({ userId: user?.id, limit: 5 }),
    enabled: !!user?.id,
  });

  // Fetch user's invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', 'home', user?.id],
    queryFn: () => invoiceApi.list({ limit: 5 }),
    enabled: !!user?.id,
  });

  // Fetch featured products
  const { data: productsData } = useQuery({
    queryKey: ['products', 'home'],
    queryFn: () => productApi.list({ limit: 6 }),
  });

  const subscriptions = subscriptionsData?.data.items || [];
  const invoices = invoicesData?.data.items || [];
  const products = productsData?.data.items?.filter((p) => p.isActive).slice(0, 6) || [];

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const totalOrders = subscriptions.length;
  const pendingInvoices = invoices.filter((i) => i.status === 'CONFIRMED').length;
  const overdueInvoices = invoices.filter(
    (i) => i.status !== 'PAID' && i.status !== 'CANCELED' && new Date(i.dueDate) < new Date()
  ).length;

  return (
    <Box className="space-y-8">
      {/* Hero Section */}
      <Box className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 border border-primary/20">
        <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between" gap={6}>
          <VStack align={{ base: 'center', md: 'start' }} spacing={4} flex={1}>
            <Heading as="h1" size="2xl" className="text-center md:text-left">
              Welcome back, {user?.name || 'Customer'}!
            </Heading>
            <Text fontSize="lg" color="gray.600" textAlign={{ base: 'center', md: 'left' }} maxW="2xl">
              Manage your subscriptions, view invoices, and discover new products all in one place.
            </Text>
            <HStack spacing={4} flexWrap="wrap" justify={{ base: 'center', md: 'start' }}>
              <Button onClick={() => navigate('/portal/shop')} size="lg">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Products
              </Button>
              <Button variant="outline" onClick={() => navigate('/portal/orders')} size="lg">
                <FileText className="h-4 w-4 mr-2" />
                View Orders
              </Button>
            </HStack>
          </VStack>
        </Flex>
      </Box>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/portal/orders')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalOrders} total orders
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/portal/orders')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time orders
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/invoices')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-lg transition-shadow ${overdueInvoices > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertCircle className={`h-4 w-4 ${overdueInvoices > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${overdueInvoices > 0 ? 'text-red-600' : ''}`}>
              {overdueInvoices}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overdueInvoices > 0 ? 'Action required' : 'All up to date'}
            </p>
          </CardContent>
        </Card>
      </SimpleGrid>

      {/* Featured Products */}
      {products.length > 0 && (
        <Box>
          <Flex justify="space-between" align="center" mb={6}>
            <Heading as="h2" size="xl">
              Featured Products
            </Heading>
            <Button variant="outline" onClick={() => navigate('/portal/shop')}>
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Flex>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 3 }} spacing={6}>
            {products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-200 border border-gray-200 overflow-hidden group"
                onClick={() => navigate(`/portal/products/${product.id}`)}
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
                      className={product.isActive ? 'bg-green-100 text-green-700' : ''}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Flex>
                </CardContent>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Recent Activity */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <CardTitle>Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/portal/orders')}>
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Flex>
          </CardHeader>
          <CardContent>
            {subscriptionsLoading ? (
              <ChakraText color="gray.500" textAlign="center" py={4}>
                Loading orders...
              </ChakraText>
            ) : subscriptions.length === 0 ? (
              <VStack spacing={4} py={8}>
                <Package className="h-12 w-12 text-gray-300" />
                <ChakraText color="gray.500" textAlign="center">
                  No orders yet
                </ChakraText>
                <Button size="sm" onClick={() => navigate('/portal/shop')}>
                  Start Shopping
                </Button>
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                {subscriptions.slice(0, 5).map((subscription) => (
                  <Box
                    key={subscription.id}
                    className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/portal/orders/${subscription.id}`)}
                  >
                    <Flex justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex={1}>
                        <ChakraText fontWeight="semibold" fontSize="sm">
                          {subscription.subscriptionNumber}
                        </ChakraText>
                        <ChakraText fontSize="xs" color="gray.500">
                          {subscription.orderDate
                            ? new Date(subscription.orderDate).toLocaleDateString()
                            : 'No date'}
                        </ChakraText>
                      </VStack>
                      <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {subscription.status}
                      </Badge>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <CardTitle>Recent Invoices</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Flex>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <ChakraText color="gray.500" textAlign="center" py={4}>
                Loading invoices...
              </ChakraText>
            ) : invoices.length === 0 ? (
              <VStack spacing={4} py={8}>
                <FileText className="h-12 w-12 text-gray-300" />
                <ChakraText color="gray.500" textAlign="center">
                  No invoices yet
                </ChakraText>
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                {invoices.slice(0, 5).map((invoice) => (
                  <Box
                    key={invoice.id}
                    className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <Flex justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex={1}>
                        <ChakraText fontWeight="semibold" fontSize="sm">
                          {invoice.invoiceNumber}
                        </ChakraText>
                        <ChakraText fontSize="xs" color="gray.500">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </ChakraText>
                      </VStack>
                      <VStack align="end" spacing={1}>
                        <Badge
                          variant={
                            invoice.status === 'PAID'
                              ? 'default'
                              : invoice.status === 'CONFIRMED'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {invoice.status}
                        </Badge>
                        <ChakraText fontSize="sm" fontWeight="semibold">
                          ${parseFloat(invoice.total).toFixed(2)}
                        </ChakraText>
                      </VStack>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </CardContent>
        </Card>
      </SimpleGrid>
    </Box>
  );
}
