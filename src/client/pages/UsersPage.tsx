import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Flex, VStack, HStack, useDisclosure, useToast, Textarea, Table, Thead, Tbody, Tr, Th, Td, Text, Spinner } from '@chakra-ui/react';
import { Plus, Trash2, Save, KeyRound, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userApi, contactApi, subscriptionApi, User, Contact, Subscription } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { FormDialog } from '@/components/FormDialog';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();

  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    relatedContactId: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Create user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPasswordCreate, setNewPasswordCreate] = useState('');
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
      setNewPasswordCreate('');
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

  const updateUserMutation = useMutation({
    mutationFn: (data: { name?: string; phone?: string; address?: string }) =>
      userApi.updateProfile(selectedUser!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User updated', status: 'success', duration: 3000 });
      setIsEditing(false);
      if (selectedUser) {
        // Refresh selected user data
        queryClient.invalidateQueries({ queryKey: ['user', selectedUser.id] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update user',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const handleCreateUser = () => {
    if (!newName || !newEmail || !newPasswordCreate) {
      toast({ title: 'Validation error', description: 'All fields are required', status: 'error', duration: 3000 });
      return;
    }
    createUserMutation.mutate({ name: newName, email: newEmail, password: newPasswordCreate, role: newRole });
  };

  const handleNew = () => {
    setSelectedUser(null);
    setIsEditing(true);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      relatedContactId: '',
    });
  };

  // Fetch contacts for selected user
  const { data: contactsData } = useQuery({
    queryKey: ['contacts', selectedUser?.id],
    queryFn: () => contactApi.list({ userId: selectedUser!.id, limit: 100 }),
    enabled: !!selectedUser?.id,
    retry: false,
  });

  const defaultContact = contactsData?.data?.items?.[0] || null;

  // Fetch subscriptions for selected user
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['subscriptions', selectedUser?.id],
    queryFn: () => subscriptionApi.list({ userId: selectedUser!.id, limit: 100 }),
    enabled: !!selectedUser?.id,
  });

  const subscriptions = subscriptionsData?.data?.items || [];

  const handleEdit = async (user: User) => {
    setSelectedUser(user);
    setIsEditing(true);
    
    // Fetch user's contacts to get default contact
    try {
      const contactsResponse = await contactApi.list({ userId: user.id, limit: 100 });
      const defaultContact = contactsResponse.data.items?.[0];
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        relatedContactId: defaultContact?.id || '',
      });
    } catch (error) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        relatedContactId: '',
      });
    }
  };

  const handleSave = () => {
    if (selectedUser) {
      updateUserMutation.mutate({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      });
    } else {
      // Create new user
      if (!formData.name || !formData.email) {
        toast({ title: 'Validation error', description: 'Name and Email are required', status: 'error', duration: 3000 });
        return;
      }
      // For now, we'll use the create dialog for new users
      onOpen();
    }
  };

  const handleDelete = () => {
    if (selectedUser) {
      // TODO: Implement delete user API
      toast({ title: 'Delete functionality', description: 'Delete user API not yet implemented', status: 'info', duration: 3000 });
    }
  };

  const handleChangePassword = () => {
    if (selectedUser) {
      onPasswordOpen();
    }
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

  const items = (data?.data as any)?.items || [];
  const total = (data?.data as any)?.total || 0;

  // Show list view if no user is selected
  if (!selectedUser && !isEditing) {
    if (!isLoading && items.length === 0 && pagination.offset === 0 && !roleFilter) {
      return (
        <Box>
          <Flex justify="space-between" align="center" className="mb-6">
            <div>
              <h1 className="text-3xl font-bold">Users</h1>
              <p className="text-muted-foreground">Manage users</p>
            </div>
          </Flex>
          <EmptyState
            icon={Plus}
            title="No users found"
            description="Create your first user to get started."
            actionLabel={isAdmin ? 'Create User' : undefined}
            onAction={isAdmin ? onOpen : undefined}
          />
        </Box>
      );
    }

    return (
      <Box>
        <Flex justify="space-between" align="center" className="mb-6">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage users</p>
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
          onRowClick={(row) => handleEdit(row)}
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
                value={newPasswordCreate}
                onChange={(e) => setNewPasswordCreate(e.target.value)}
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

  const handleBackToList = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      relatedContactId: '',
    });
  };

  // Show detail/edit view
  return (
    <Box>
      {/* Action Bar */}
      <Flex justify="space-between" align="center" className="mb-6">
        <HStack spacing={2}>
          <Button onClick={handleBackToList} size="sm" variant="outline">
            ← Back
          </Button>
          <Button onClick={handleNew} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
          <Button onClick={handleDelete} size="sm" variant="outline" disabled={!selectedUser}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleSave} size="sm" variant="outline" disabled={!isEditing}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </HStack>
        <Button onClick={handleChangePassword} size="sm" variant="outline" disabled={!selectedUser}>
          <KeyRound className="h-4 w-4 mr-2" />
          Change password
        </Button>
      </Flex>

      <Card>
        <CardHeader>
          <CardTitle>{selectedUser ? 'Edit User' : 'New User'}</CardTitle>
        </CardHeader>
        <CardContent>
          <VStack spacing={4} align="stretch">
            <Flex gap={4}>
              <Box flex={1}>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name"
                  disabled={!isEditing}
                />
              </Box>
              <Box flex={1}>
                <Label htmlFor="relatedContact">Related contact</Label>
                <select
                  id="relatedContact"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={formData.relatedContactId}
                  onChange={(e) => setFormData({ ...formData, relatedContactId: e.target.value })}
                  disabled={!isEditing}
                >
                  <option value="">Select contact</option>
                  {contactsData?.data?.items?.map((contact: Contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} ({contact.email})
                    </option>
                  ))}
                </select>
              </Box>
            </Flex>

            <Box>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
                disabled={!isEditing || !!selectedUser}
              />
            </Box>

            <Box>
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                disabled={!isEditing}
              />
            </Box>

            <Box>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
                disabled={!isEditing}
                rows={3}
              />
            </Box>
          </VStack>
        </CardContent>
      </Card>

      {/* Subscriptions Section */}
      {selectedUser && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Subscriptions
            </CardTitle>
            <CardDescription>All subscriptions for this user</CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptionsLoading ? (
              <Flex justify="center" py={8}>
                <Spinner />
              </Flex>
            ) : subscriptions.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.600">No subscriptions found</Text>
              </Box>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Subscription Number</Th>
                    <Th>Status</Th>
                    <Th>Created Date</Th>
                    <Th>Plan</Th>
                    <Th>Next Billing</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {subscriptions.map((subscription: Subscription) => {
                    const createdDate = subscription.createdAt
                      ? new Date(subscription.createdAt).toLocaleDateString()
                      : 'N/A';
                    const nextBilling = subscription.nextBillingDate
                      ? new Date(subscription.nextBillingDate).toLocaleDateString()
                      : '-';

                    return (
                      <Tr
                        key={subscription.id}
                        cursor="pointer"
                        _hover={{ bg: 'gray.50' }}
                        onClick={() => navigate(`/subscriptions/${subscription.id}`)}
                      >
                        <Td>
                          <Text fontWeight="medium">{subscription.subscriptionNumber}</Text>
                        </Td>
                        <Td>
                          <StatusBadge status={subscription.status} type="subscription" />
                        </Td>
                        <Td>
                          <Text fontSize="sm">{createdDate}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" className="capitalize">
                            {subscription.plan?.billingPeriod
                              ? String(subscription.plan.billingPeriod).charAt(0) +
                                String(subscription.plan.billingPeriod).slice(1).toLowerCase()
                              : '-'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{nextBilling}</Text>
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/subscriptions/${subscription.id}`);
                            }}
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
      )}

      {/* Change Password Dialog */}
      <FormDialog
        isOpen={isPasswordOpen}
        onClose={onPasswordClose}
        title="Change Password"
        onSubmit={() => {
          if (newPassword !== confirmPassword) {
            toast({ title: 'Error', description: 'Passwords do not match', status: 'error', duration: 3000 });
            return;
          }
          // TODO: Implement change password API
          toast({ title: 'Info', description: 'Change password API not yet implemented', status: 'info', duration: 3000 });
          onPasswordClose();
        }}
        submitText="Change Password"
      >
        <VStack spacing={4} align="stretch">
          <div>
            <Label htmlFor="newPassword">New Password *</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>
        </VStack>
      </FormDialog>
    </Box>
  );
}
