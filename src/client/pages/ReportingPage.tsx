import { useQuery } from '@tanstack/react-query';
import { Box, Flex, SimpleGrid } from '@chakra-ui/react';
import { BarChart3, TrendingUp, AlertCircle, DollarSign, FileText, Activity, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reportApi } from '@/lib/api';

export default function ReportingPage() {
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: () => reportApi.getSummary(),
  });

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['reports', 'subscriptionMetrics'],
    queryFn: () => reportApi.getSubscriptionMetrics(),
  });

  const summary = summaryData?.data?.summary;
  const metrics = metricsData?.data?.metrics || [];

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    QUOTATION: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-purple-100 text-purple-800',
    ACTIVE: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-200 text-gray-700',
  };

  return (
    <Box className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reporting</h1>
        <p className="text-muted-foreground">Overview of your subscription business metrics</p>
      </div>

      {/* Key Metrics */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? '...' : summary?.activeSubscriptionsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? '...' : `$${(summary?.totalRevenue || 0).toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? '...' : `$${(summary?.totalPayments || 0).toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">All recorded payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.overdueInvoicesCount || 0) > 0 ? 'text-red-600' : ''}`}>
              {summaryLoading ? '...' : summary?.overdueInvoicesCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </SimpleGrid>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Status Breakdown
            </CardTitle>
            <CardDescription>Overview of invoices by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <Flex align="center" gap={2}>
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="font-medium">Draft</span>
                </Flex>
                <span className="text-2xl font-bold">{summary?.draftInvoicesCount || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <Flex align="center" gap={2}>
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="font-medium">Confirmed</span>
                </Flex>
                <span className="text-2xl font-bold">{summary?.confirmedInvoicesCount || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <Flex align="center" gap={2}>
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="font-medium">Paid</span>
                </Flex>
                <span className="text-2xl font-bold">{summary?.paidInvoicesCount || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md bg-red-50">
                <Flex align="center" gap={2}>
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="font-medium text-red-700">Overdue</span>
                </Flex>
                <span className="text-2xl font-bold text-red-600">{summary?.overdueInvoicesCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Subscriptions by Status
            </CardTitle>
            <CardDescription>Distribution of subscriptions across states</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : metrics.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No subscription data</p>
            ) : (
              <div className="space-y-4">
                {metrics.map((metric) => {
                  const total = metrics.reduce((sum, m) => sum + m.count, 0);
                  const percentage = total > 0 ? ((metric.count / total) * 100).toFixed(0) : 0;
                  return (
                    <div key={metric.status} className="space-y-2">
                      <Flex justify="space-between" align="center">
                        <Badge className={statusColors[metric.status] || 'bg-gray-100 text-gray-800'}>
                          {metric.status}
                        </Badge>
                        <span className="font-semibold">{metric.count}</span>
                      </Flex>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            metric.status === 'ACTIVE'
                              ? 'bg-green-500'
                              : metric.status === 'CONFIRMED'
                              ? 'bg-purple-500'
                              : metric.status === 'QUOTATION'
                              ? 'bg-blue-500'
                              : metric.status === 'DRAFT'
                              ? 'bg-gray-400'
                              : 'bg-gray-300'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Summary
          </CardTitle>
          <CardDescription>Financial overview</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-green-800">${(summary?.totalRevenue || 0).toFixed(2)}</p>
              <p className="text-xs text-green-600">Sum of all paid invoices</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">Total Payments Collected</p>
              <p className="text-3xl font-bold text-blue-800">${(summary?.totalPayments || 0).toFixed(2)}</p>
              <p className="text-xs text-blue-600">Sum of all payment records</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-700 font-medium">Outstanding</p>
              <p className="text-3xl font-bold text-orange-800">
                ${Math.max(0, (summary?.totalRevenue || 0) - (summary?.totalPayments || 0)).toFixed(2)}
              </p>
              <p className="text-xs text-orange-600">Revenue minus payments</p>
            </div>
          </SimpleGrid>
        </CardContent>
      </Card>
    </Box>
  );
}
