
import { useNavigate } from 'react-router-dom';
import { Box, Flex, SimpleGrid, VStack, Table, Thead, Tbody, Tr, Th, Td, Text, HStack, Spinner } from '@chakra-ui/react';
import { User, Shield, Mail, Calendar, LogOut, FileText, Package, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { subscriptionApi, invoiceApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function MyProfilePage() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  // Fetch user's subscriptions (orders)
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: () => subscriptionApi.list({ userId: user?.id, limit: 10 }),
    enabled: !!user?.id,
  });

  // Fetch user's invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: () => invoiceApi.list({ limit: 10 }),
    enabled: !!user?.id,
  });

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleOrderClick = (subscriptionId: string) => {
    navigate(`/portal/orders/${subscriptionId}`);
  };

  const handleInvoiceClick = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
  };

  const handleDownloadOrder = (subscriptionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/v1/subscriptions/${subscriptionId}/pdf`, '_blank');
  };

  // Calculate total for a subscription
  const calculateTotal = (subscription: any) => {
    if (!subscription.lines || subscription.lines.length === 0) return 0;
    let total = 0;
    subscription.lines.forEach((line: any) => {
      const lineSubtotal = line.quantity * parseFloat(line.unitPrice);
      let discount = 0;
      if (line.discount) {
        if (line.discount.type === 'PERCENTAGE') {
          discount = lineSubtotal * (parseFloat(line.discount.value) / 100);
        } else {
          discount = parseFloat(line.discount.value);
        }
      }
      const afterDiscount = lineSubtotal - discount;
      const tax = line.taxRate ? afterDiscount * (parseFloat(line.taxRate.rate) / 100) : 0;
      total += afterDiscount + tax;
    });
    return total;
  };

  const subscriptions = subscriptionsData?.data.items || [];
  const invoices = invoicesData?.data.items || [];

  if (!user) {
    return (
      <Box>
        <p className="text-center text-muted-foreground py-12">Not logged in</p>
      </Box>
    );
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-800',
    INTERNAL: 'bg-blue-100 text-blue-800',
    PORTAL: 'bg-green-100 text-green-800',
  };

  const roleDescriptions: Record<string, string> = {
    ADMIN: 'Full access to all features including user management, products, configuration, and reports.',
    INTERNAL: 'Can manage subscriptions, invoices, and payments. Can view products, plans, and reports.',
    PORTAL: 'Customer portal access. Can view own subscriptions and invoices.',
  };

  return (
    <Box className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View and manage your account information</p>
      </div>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <VStack spacing={5} align="stretch">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{user.name}</h3>
                  <Badge className={roleColors[user.role] || 'bg-gray-100 text-gray-800'}>
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Flex align="center" gap={3} className="p-3 bg-gray-50 rounded-md">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </Flex>

                <Flex align="center" gap={3} className="p-3 bg-gray-50 rounded-md">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="font-medium">{user.role}</p>
                  </div>
                </Flex>

                <Flex align="center" gap={3} className="p-3 bg-gray-50 rounded-md">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </Flex>
              </div>
            </VStack>
          </CardContent>
        </Card>

        {/* Role & Permissions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role & Permissions
            </CardTitle>
            <CardDescription>What you can do in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <VStack spacing={4} align="stretch">
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="font-semibold mb-2">{user.role} Role</p>
                <p className="text-sm text-muted-foreground">
                  {roleDescriptions[user.role] || 'Standard access.'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Your Capabilities:</p>
                {user.role === 'ADMIN' && (
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Manage users and contacts</li>
                    <li>Create and manage products</li>
                    <li>Configure tax rates, discounts, and plans</li>
                    <li>Full subscription lifecycle management</li>
                    <li>Invoice and payment management</li>
                    <li>Access reports and analytics</li>
                  </ul>
                )}
                {user.role === 'INTERNAL' && (
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Create and manage subscriptions</li>
                    <li>Invoice and payment management</li>
                    <li>View products and plans</li>
                    <li>Access reports and analytics</li>
                  </ul>
                )}
                {user.role === 'PORTAL' && (
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>View your subscriptions</li>
                    <li>View your invoices</li>
                    <li>View available products</li>
                  </ul>
                )}
              </div>
            </VStack>
          </CardContent>
        </Card>
      </SimpleGrid>

      {/* Previous Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Previous Orders
          </CardTitle>
          <CardDescription>Your recent subscription orders</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionsLoading ? (
            <Flex justify="center" py={8}>
              <Spinner />
            </Flex>
          ) : subscriptions.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.600">No orders found</Text>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Order Number</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th>Total</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {subscriptions.map((subscription: any) => {
                  const total = calculateTotal(subscription);
                  const orderDate = subscription.orderDate
                    ? new Date(subscription.orderDate).toLocaleDateString()
                    : subscription.createdAt
                    ? new Date(subscription.createdAt).toLocaleDateString()
                    : 'N/A';

                  return (
                    <Tr
                      key={subscription.id}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handleOrderClick(subscription.id)}
                    >
                      <Td>
                        <Text fontWeight="medium">{subscription.subscriptionNumber}</Text>
                      </Td>
                      <Td>{orderDate}</Td>
                      <Td>
                        <Badge
                          className={
                            subscription.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : subscription.status === 'CONFIRMED'
                              ? 'bg-blue-100 text-blue-800'
                              : subscription.status === 'CLOSED'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {subscription.status}
                        </Badge>
                      </Td>
                      <Td>₹{total.toFixed(2)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleDownloadOrder(subscription.id, e)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOrderClick(subscription.id)}
                          >
                            View
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Previous Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Previous Invoices
          </CardTitle>
          <CardDescription>Your recent invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <Flex justify="center" py={8}>
              <Spinner />
            </Flex>
          ) : invoices.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.600">No invoices found</Text>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Invoice Number</Th>
                  <Th>Issue Date</Th>
                  <Th>Due Date</Th>
                  <Th>Status</Th>
                  <Th>Total</Th>
                  <Th>Paid</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {invoices.map((invoice: any) => {
                  const total = parseFloat(invoice.total);
                  const paid = parseFloat(invoice.paidAmount);
                  const outstanding = total - paid;

                  return (
                    <Tr
                      key={invoice.id}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handleInvoiceClick(invoice.id)}
                    >
                      <Td>
                        <Text fontWeight="medium">{invoice.invoiceNumber}</Text>
                      </Td>
                      <Td>{new Date(invoice.issueDate).toLocaleDateString()}</Td>
                      <Td>{new Date(invoice.dueDate).toLocaleDateString()}</Td>
                      <Td>
                        <Badge
                          className={
                            invoice.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'CONFIRMED'
                              ? 'bg-blue-100 text-blue-800'
                              : invoice.status === 'CANCELED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </Td>
                      <Td>₹{total.toFixed(2)}</Td>
                      <Td>
                        <Text color={outstanding > 0 ? 'red.600' : 'green.600'}>
                          ₹{paid.toFixed(2)}
                        </Text>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleInvoiceClick(invoice.id)}
                        >
                          View
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Flex gap={3}>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </Flex>
        </CardContent>
      </Card>
    </Box>
  );
}
