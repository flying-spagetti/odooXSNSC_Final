import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import { Plus, FileText } from 'lucide-react';
import { subscriptionApi, Subscription } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { useAuthStore } from '@/store/authStore';

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('');

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
      header: 'Subscription #',
      accessor: 'subscriptionNumber',
      cell: (value) => <span className="font-mono text-sm font-medium">{value}</span>,
    },
    {
      header: 'Customer',
      accessor: (row) => row.user?.name || '-',
      cell: (value, row) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">{row.user?.email}</p>
        </div>
      ),
    },
    {
      header: 'Plan',
      accessor: (row) => row.plan?.name || '-',
      cell: (value, row) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">
            {row.plan?.billingPeriod}
          </p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value) => <StatusBadge status={value} type="subscription" />,
    },
    {
      header: 'Start Date',
      accessor: 'startDate',
      cell: (value) => (
        <span className="text-sm">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      header: 'Lines',
      accessor: (row) => row._count?.lines || 0,
      cell: (value) => <span className="text-sm">{value} items</span>,
    },
  ];

  const canCreateSubscription = user?.role === 'ADMIN' || user?.role === 'INTERNAL';

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
        {canCreateSubscription && (
          <Button onClick={() => navigate('/subscriptions/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Subscription
          </Button>
        )}
      </Flex>

      <Flex gap={4} className="mb-4">
        <select
          className="px-3 py-2 border rounded-md"
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
        data={data?.data.items || []}
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
