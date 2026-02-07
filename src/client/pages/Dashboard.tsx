import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { subscriptionApi, invoiceApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Box, SimpleGrid, Flex } from '@chakra-ui/react';
import { FileText, DollarSign, CreditCard, Activity, Plus, Package, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: subscriptions } = useQuery({
    queryKey: ['subscriptions', 'dashboard'],
    queryFn: () => subscriptionApi.list({ limit: 5 }),
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices', 'dashboard'],
    queryFn: () => invoiceApi.list({ limit: 5 }),
  });

  const activeCount = subscriptions?.data.items.filter((s) => s.status === 'ACTIVE').length || 0;
  const totalRevenue = invoices?.data.items
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + parseFloat(i.total), 0) || 0;
  const overdueInvoices = invoices?.data.items.filter(
    (i) => i.status !== 'PAID' && i.status !== 'CANCELED' && new Date(i.dueDate) < new Date()
  ) || [];
  const pendingInvoices = invoices?.data.items.filter((i) => i.status === 'CONFIRMED').length || 0;
  
  const canCreateSubscription = user?.role === 'ADMIN' || user?.role === 'INTERNAL';
  const canManageProducts = user?.role === 'ADMIN';

  return (
    <Box className="space-y-6">
      <Flex justify="space-between" align="center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your subscriptions today.
          </p>
        </div>
        <Flex gap={2}>
          {canManageProducts && (
            <Button variant="outline" onClick={() => navigate('/products')}>
              <Package className="h-4 w-4 mr-2" />
              Manage Products
            </Button>
          )}
          {canCreateSubscription && (
            <Button onClick={() => navigate('/subscriptions/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Subscription
            </Button>
          )}
        </Flex>
      </Flex>

      {overdueInvoices.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <Flex align="center" gap={2}>
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">
                  You have {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''}
                </p>
                <p className="text-red-700 text-sm">
                  Total overdue: ${overdueInvoices.reduce((sum, i) => sum + parseFloat(i.total), 0).toFixed(2)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/invoices')}>
                View Invoices
              </Button>
            </Flex>
          </CardContent>
        </Card>
      )}

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {subscriptions?.data.total || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => navigate('/invoices')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices?.data.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {pendingInvoices} pending
              {overdueInvoices.length > 0 && ` • ${overdueInvoices.length} overdue`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.role}</div>
            <p className="text-xs text-muted-foreground">Access level</p>
          </CardContent>
        </Card>
      </SimpleGrid>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Subscriptions</CardTitle>
            <CardDescription>Latest subscription activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions?.data.items.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between cursor-pointer hover:bg-accent p-2 rounded-md -mx-2"
                  onClick={() => navigate(`/subscriptions/${sub.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">{sub.subscriptionNumber}</p>
                    <p className="text-xs text-muted-foreground">{sub.user?.email}</p>
                  </div>
                  <StatusBadge status={sub.status} type="subscription" />
                </div>
              ))}
              {(!subscriptions || subscriptions.data.items.length === 0) && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    No subscriptions yet
                  </p>
                  {canCreateSubscription && (
                    <Button size="sm" onClick={() => navigate('/subscriptions/new')}>
                      Create First Subscription
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Latest invoice activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices?.data.items.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between cursor-pointer hover:bg-accent p-2 rounded-md -mx-2"
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      ${parseFloat(inv.total).toFixed(2)}
                      {inv.status !== 'PAID' && inv.status !== 'CANCELED' && new Date(inv.dueDate) < new Date() && (
                        <span className="text-red-600 ml-2">• Overdue</span>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} type="invoice" />
                </div>
              ))}
              {(!invoices || invoices.data.items.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No invoices yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Box>
  );
}
