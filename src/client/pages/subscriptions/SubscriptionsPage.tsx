import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import { Plus, FileText, Trash2, Save, Search } from 'lucide-react';
import { subscriptionApi, Subscription } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { useAuthStore } from '@/store/authStore';

// Calculate total recurring amount for a subscription
function calculateRecurringAmount(sub: Subscription): number {
  if (!sub.lines || sub.lines.length === 0) return 0;
  let total = 0;
  sub.lines.forEach((line: any) => {
    let subtotal = line.quantity * parseFloat(line.unitPrice);
    let discount = 0;
    if (line.discount) {
      if (line.discount.type === 'PERCENTAGE') {
        discount = subtotal * (parseFloat(line.discount.value) / 100);
      } else {
        discount = parseFloat(line.discount.value);
      }
    }
    const afterDiscount = subtotal - discount;
    const tax = line.taxRate ? afterDiscount * (parseFloat(line.taxRate.rate) / 100) : 0;
    total += afterDiscount + tax;
  });
  return total;
}

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', pagination, statusFilter],
    queryFn: () =>
      subscriptionApi.list({
        ...pagination,
        status: statusFilter || undefined,
      }),
  });

  const columns: Column<Subscription>[] = [
    {
      header: 'Number',
      accessor: 'subscriptionNumber',
      cell: (value) => <span className="font-mono text-sm font-medium">{value}</span>,
    },
    {
      header: 'Customer',
      accessor: (row) => row.user?.name || '-',
      cell: (value) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      header: 'Next Invoice',
      accessor: 'nextBillingDate',
      cell: (value) => (
        <span className="text-sm">
          {value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
        </span>
      ),
    },
    {
      header: 'Recurring',
      accessor: (row) => calculateRecurringAmount(row),
      cell: (value) => (
        <span className="text-sm font-semibold">
          {value > 0 ? `₹${Number(value).toFixed(0)}` : '-'}
        </span>
      ),
    },
    {
      header: 'Plan',
      accessor: (row) => row.plan?.billingPeriod || '-',
      cell: (value) => (
        <span className="text-sm capitalize">{value ? String(value).charAt(0) + String(value).slice(1).toLowerCase() : '-'}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value) => <StatusBadge status={value} type="subscription" />,
    },
  ];

  const canCreateSubscription = user?.role === 'ADMIN' || user?.role === 'INTERNAL';

  // Filter data based on search term
  const filteredData = (data?.data?.items || []).filter((sub: Subscription) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      sub.subscriptionNumber.toLowerCase().includes(term) ||
      (sub.user?.name || '').toLowerCase().includes(term) ||
      (sub.user?.email || '').toLowerCase().includes(term)
    );
  });

  if (!isLoading && (!data || data.data.items.length === 0) && pagination.offset === 0 && !statusFilter) {
    return (
      <Box>
        <Flex justify="space-between" align="center" className="mb-6">
          <div>
            <h1 className="text-3xl font-bold">Subscriptions</h1>
            <p className="text-muted-foreground">Manage customer subscriptions</p>
          </div>
        </Flex>
        <EmptyState
          icon={FileText}
          title="No subscriptions yet"
          description="Create your first subscription to get started with recurring billing."
          actionLabel={canCreateSubscription ? "Create Subscription" : undefined}
          onAction={canCreateSubscription ? () => navigate('/subscriptions/new') : undefined}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" className="mb-6">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Manage customer subscriptions</p>
        </div>
      </Flex>

      {/* Action bar matching mockup: New, Delete, Save icons + search bar */}
      <Flex gap={3} align="center" className="mb-4">
        {canCreateSubscription && (
          <Button onClick={() => navigate('/subscriptions/new')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        )}
        
        {/* Search bar */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <select
          className="px-3 py-2 border rounded-md text-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination({ ...pagination, offset: 0 });
          }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="QUOTATION">Quotation</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
        </select>
      </Flex>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        pagination={{
          total: data?.data.total || 0,
          limit: pagination.limit,
          offset: pagination.offset,
          onPageChange: (offset) => setPagination({ ...pagination, offset }),
        }}
        onRowClick={(row) => navigate(`/subscriptions/${row.id}`)}
      />
    </Box>
  );
}
