import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Flex, VStack, useDisclosure, useToast } from '@chakra-ui/react';
import { Users, Plus, UserPlus } from 'lucide-react';
import { userApi, User } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { FormDialog } from '@/components/FormDialog';
import { useAuthStore } from '@/store/authStore';

export default function UsersContactsPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [roleFilter, setRoleFilter] = useState<string>('');

  // Create user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'INTERNAL' | 'PORTAL'>('PORTAL');

  const { data, isLoading } = useQuery({
    queryKey: ['users', pagination, roleFilter],
    queryFn: () =>
      userApi.list({
        ...pagination,
        role: roleFilter || undefined,
      }),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: { email: string; password: string; name: string; role: 'INTERNAL' | 'PORTAL' }) =>
      userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User created', status: 'success', duration: 3000 });
      onClose();
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('PORTAL');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create user',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const handleCreateUser = () => {
    if (!newName || !newEmail || !newPassword) {
      toast({ title: 'Validation error', description: 'All fields are required', status: 'error', duration: 3000 });
      return;
    }
    createUserMutation.mutate({ name: newName, email: newEmail, password: newPassword, role: newRole });
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-800',
    INTERNAL: 'bg-blue-100 text-blue-800',
    PORTAL: 'bg-green-100 text-green-800',
  };

  const columns: Column<User>[] = [
    {
      header: 'Name',
      accessor: 'name',
      cell: (value) => <span className="font-medium">{value}</span>,
    },
    {
      header: 'Email',
      accessor: 'email',
      cell: (value) => <span className="text-sm text-muted-foreground">{value}</span>,
    },
    {
      header: 'Role',
      accessor: 'role',
      cell: (value) => (
        <Badge className={roleColors[value] || 'bg-gray-100 text-gray-800'}>
          {value}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (value) => (
        <Badge className={value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      cell: (value) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const isAdmin = currentUser?.role === 'ADMIN';

  if (!isLoading && (!data || (data.data as any)?.items?.length === 0) && pagination.offset === 0 && !roleFilter) {
    return (
      <Box>
        <Flex justify="space-between" align="center" className="mb-6">
          <div>
            <h1 className="text-3xl font-bold">Users / Contacts</h1>
            <p className="text-muted-foreground">Manage users and contacts</p>
          </div>
        </Flex>
        <EmptyState
          icon={Users}
          title="No users found"
          description="Create your first user to get started."
          actionLabel={isAdmin ? 'Create User' : undefined}
          onAction={isAdmin ? onOpen : undefined}
        />
      </Box>
    );
  }

  const items = (data?.data as any)?.items || [];
  const total = (data?.data as any)?.total || 0;

  return (
    <Box>
      <Flex justify="space-between" align="center" className="mb-6">
        <div>
          <h1 className="text-3xl font-bold">Users / Contacts</h1>
          <p className="text-muted-foreground">Manage users and contacts</p>
        </div>
      </Flex>

      <Flex gap={3} align="center" className="mb-4">
        {isAdmin && (
          <Button onClick={onOpen} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New User
          </Button>
        )}

        <select
          className="px-3 py-2 border rounded-md text-sm"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPagination({ ...pagination, offset: 0 });
          }}
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="INTERNAL">Internal</option>
          <option value="PORTAL">Portal</option>
        </select>
      </Flex>

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        pagination={{
          total,
          limit: pagination.limit,
          offset: pagination.offset,
          onPageChange: (offset) => setPagination({ ...pagination, offset }),
        }}
      />

      {/* Create User Dialog */}
      <FormDialog
        isOpen={isOpen}
        onClose={onClose}
        title="Create New User"
        onSubmit={handleCreateUser}
        submitText={createUserMutation.isPending ? 'Creating...' : 'Create User'}
        isLoading={createUserMutation.isPending}
      >
        <VStack spacing={4} align="stretch">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role *</Label>
            <select
              id="role"
              className="w-full mt-1 px-3 py-2 border rounded-md"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'INTERNAL' | 'PORTAL')}
            >
              <option value="PORTAL">Portal (Customer)</option>
              <option value="INTERNAL">Internal (Staff)</option>
            </select>
          </div>
        </VStack>
      </FormDialog>
    </Box>
  );
}
