import { useQuery } from '@tanstack/react-query';
import { subscriptionApi, invoiceApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Box, SimpleGrid } from '@chakra-ui/react';
import { FileText, DollarSign, CreditCard, Activity } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();

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

  return (
    <Box className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your subscriptions today.
        </p>
      </div>

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices?.data.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {invoices?.data.items.filter((i) => i.status === 'CONFIRMED').length || 0} pending
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
                <div key={sub.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{sub.subscriptionNumber}</p>
                    <p className="text-xs text-muted-foreground">{sub.user?.email}</p>
                  </div>
                  <Badge
                    variant={
                      sub.status === 'ACTIVE'
                        ? 'success'
                        : sub.status === 'CLOSED'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {sub.status}
                  </Badge>
                </div>
              ))}
              {(!subscriptions || subscriptions.data.items.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No subscriptions yet
                </p>
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
                <div key={inv.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      ${parseFloat(inv.total).toFixed(2)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      inv.status === 'PAID'
                        ? 'success'
                        : inv.status === 'CANCELED'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {inv.status}
                  </Badge>
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
