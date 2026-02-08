import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import { FileText, AlertCircle } from 'lucide-react';
import { invoiceApi, Invoice } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@chakra-ui/react';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', pagination, statusFilter],
    queryFn: () =>
      invoiceApi.list({
        ...pagination,
        status: statusFilter || undefined,
      }),
  });

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === 'PAID' || invoice.status === 'CANCELED') return false;
    return new Date(invoice.dueDate) < new Date();
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      cell: (value) => <span className="font-mono text-sm font-medium">{value}</span>,
    },
    {
      header: 'Subscription',
      accessor: (row) => row.subscription?.subscriptionNumber || '-',
      cell: (value) => <span className="text-sm">{value}</span>,
    },
    {
      header: 'Customer',
      accessor: (row) => row.subscription?.user?.name || '-',
      cell: (value, row) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">{row.subscription?.user?.email}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value, row) => (
        <Flex align="center" gap={2}>
          <StatusBadge status={value} type="invoice" />
          {isOverdue(row) && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </Flex>
      ),
    },
    {
      header: 'Amount',
      accessor: 'total',
      cell: (value) => <span className="font-semibold">₹{parseFloat(value).toFixed(2)}</span>,
    },
    {
      header: 'Paid',
      accessor: 'paidAmount',
      cell: (value) => <span className="text-sm">₹{parseFloat(value).toFixed(2)}</span>,
    },
    {
      header: 'Due Date',
      accessor: 'dueDate',
      cell: (value, row) => (
        <span className={`text-sm ${isOverdue(row) ? 'text-red-600 font-medium' : ''}`}>
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (!isLoading && (!data || data.data.items.length === 0) && pagination.offset === 0 && !statusFilter) {
    return (
      <Box>
        <Flex justify="space-between" align="center" className="mb-6">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Manage customer invoices and payments</p>
          </div>
        </Flex>
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Invoices are generated automatically from active subscriptions."
        />
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" className="mb-6">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage customer invoices and payments</p>
        </div>
        <button className=" text-black bg-gray-200 px-4 py-2 rounded-md" onClick={() => navigate('/portal/my-account')}>My Account</button>
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
          <option value="CONFIRMED">Confirmed</option>
          <option value="PAID">Paid</option>
          <option value="CANCELED">Canceled</option>
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
        onRowClick={(row) => navigate(`/invoices/${row.id}`)}
      />
    </Box>
  );
}
