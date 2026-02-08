import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, VStack, HStack, useDisclosure, useToast, Textarea } from '@chakra-ui/react';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import { subscriptionApi, contactApi, userApi, Contact, User } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/EmptyState';
import { FormDialog } from '@/components/FormDialog';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ContactsPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'INTERNAL';

  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Create contact form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newUserId, setNewUserId] = useState('');

  // Fetch contacts
  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts', pagination],
    queryFn: () => contactApi.list(pagination),
    retry: false,
  });

  // Get active subscriptions count for selected contact
  const { data: subscriptionsCountData } = useQuery({
    queryKey: ['contact-subscriptions-count', selectedContact?.id],
    queryFn: () => contactApi.getActiveSubscriptionsCount(selectedContact!.id),
    enabled: !!selectedContact?.id,
  });

  // Fetch users for dropdown (only for ADMIN/INTERNAL)
  const { data: usersData } = useQuery({
    queryKey: ['users', 'for-contacts'],
    queryFn: () => userApi.list({ limit: 100 }),
    enabled: isAdmin, // Only fetch if admin/internal
  });

  const users = usersData?.data?.items || [];
  const activeSubscriptionsCount = subscriptionsCountData?.data?.count || 0;
  
  // Auto-populate userId for PORTAL users
  useEffect(() => {
    if (currentUser?.role === 'PORTAL' && currentUser.id && !newUserId) {
      setNewUserId(currentUser.id);
    }
  }, [currentUser, newUserId]);

  const createContactMutation = useMutation({
    mutationFn: (data: { userId: string; name: string; email: string; phone?: string; address?: string }) =>
      contactApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: 'Contact created', status: 'success', duration: 3000 });
      onClose();
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewAddress('');
      setNewUserId('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create contact',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: (data: { name?: string; email?: string; phone?: string; address?: string }) =>
      contactApi.update(selectedContact!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-subscriptions-count'] });
      toast({ title: 'Contact updated', status: 'success', duration: 3000 });
      setIsEditing(false);
      if (selectedContact) {
        queryClient.invalidateQueries({ queryKey: ['contact', selectedContact.id] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update contact',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const handleCreateContact = () => {
    if (!newName || !newEmail || !newUserId) {
      toast({ title: 'Validation error', description: 'Name, Email, and User are required', status: 'error', duration: 3000 });
      return;
    }
    createContactMutation.mutate({
      userId: newUserId,
      name: newName,
      email: newEmail,
      phone: newPhone || undefined,
      address: newAddress || undefined,
    });
  };

  const handleNew = () => {
    setSelectedContact(null);
    setIsEditing(true);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
    });
  };

  const handleEdit = async (contact: Contact) => {
    // Fetch full contact data
    try {
      const response = await contactApi.get(contact.id);
      setSelectedContact(response.data.contact);
      setIsEditing(true);
      setFormData({
        name: response.data.contact.name || '',
        email: response.data.contact.email || '',
        phone: response.data.contact.phone || '',
        address: response.data.contact.address || '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load contact',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleSave = () => {
    if (selectedContact) {
      updateContactMutation.mutate({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      });
    } else {
      // Create new contact - need userId
      if (!formData.name || !formData.email) {
        toast({ title: 'Validation error', description: 'Name and Email are required', status: 'error', duration: 3000 });
        return;
      }
      // For new contacts, we need userId - show dialog instead
      onOpen();
    }
  };

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => contactApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedContact(null);
      setIsEditing(false);
      toast({ title: 'Contact deleted', status: 'success', duration: 3000 });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete contact',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const handleDelete = () => {
    if (selectedContact) {
      if (confirm('Are you sure you want to delete this contact?')) {
        deleteContactMutation.mutate(selectedContact.id);
      }
    }
  };

  const handleBackToList = () => {
    setSelectedContact(null);
    setIsEditing(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
    });
  };

  const handleViewSubscriptions = () => {
    if (selectedContact) {
      navigate(`/subscriptions?contactId=${selectedContact.id}`);
    }
  };

  const columns: Column<Contact>[] = [
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
      header: 'Phone',
      accessor: 'phone',
      cell: (value) => <span className="text-sm text-muted-foreground">{value || '-'}</span>,
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

  const items = data?.data?.items || [];
  const total = data?.data?.total || 0;

  // Show list view if no contact is selected
  if (!selectedContact && !isEditing) {
    if (error) {
      return (
        <Box>
          <Flex justify="space-between" align="center" className="mb-6">
            <div>
              <h1 className="text-3xl font-bold">Contacts</h1>
              <p className="text-muted-foreground">Manage contacts</p>
            </div>
          </Flex>
          <Box className="p-6 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">
              Error loading contacts: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <p className="text-sm text-red-600 mt-2">
              Make sure the database migration has been run: npx prisma migrate dev
            </p>
          </Box>
        </Box>
      );
    }

    if (!isLoading && items.length === 0 && pagination.offset === 0) {
      return (
        <Box>
          <Flex justify="space-between" align="center" className="mb-6">
            <div>
              <h1 className="text-3xl font-bold">Contacts</h1>
              <p className="text-muted-foreground">Manage contacts</p>
            </div>
          </Flex>
          <EmptyState
            icon={Plus}
            title="No contacts found"
            description="Create your first contact to get started."
            actionLabel={isAdmin ? 'Create Contact' : undefined}
            onAction={isAdmin ? onOpen : undefined}
          />
          
          {/* Create Contact Dialog - must be included in early return */}
          <FormDialog
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Contact"
            onSubmit={handleCreateContact}
            submitText={createContactMutation.isPending ? 'Creating...' : 'Create Contact'}
            isLoading={createContactMutation.isPending}
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
              {isAdmin ? (
                <div>
                  <Label htmlFor="userId">User *</Label>
                  <select
                    id="userId"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    required
                  >
                    <option value="">Select a user...</option>
                    {users.map((user: User) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                // For PORTAL users, userId is auto-populated (hidden)
                <input type="hidden" value={newUserId} />
              )}
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
            </VStack>
          </FormDialog>
        </Box>
      );
    }

    return (
      <Box>
        <Flex justify="space-between" align="center" className="mb-6">
          <div>
            <h1 className="text-3xl font-bold">Contacts</h1>
            <p className="text-muted-foreground">Manage contacts</p>
          </div>
        </Flex>

        <Flex gap={3} align="center" className="mb-4">
          {isAdmin && (
            <Button onClick={onOpen} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Contact
            </Button>
          )}
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

        {/* Create Contact Dialog */}
        <FormDialog
          isOpen={isOpen}
          onClose={onClose}
          title="Create New Contact"
          onSubmit={handleCreateContact}
          submitText={createContactMutation.isPending ? 'Creating...' : 'Create Contact'}
          isLoading={createContactMutation.isPending}
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
            {isAdmin ? (
              <div>
                <Label htmlFor="userId">User *</Label>
                <select
                  id="userId"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  required
                >
                  <option value="">Select a user...</option>
                  {users.map((user: User) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              // For PORTAL users, userId is auto-populated (hidden)
              <input type="hidden" value={newUserId} />
            )}
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Enter address"
                rows={3}
              />
            </div>
          </VStack>
        </FormDialog>
      </Box>
    );
  }

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
          <Button onClick={handleDelete} size="sm" variant="outline" disabled={!selectedContact}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleSave} size="sm" variant="outline" disabled={!isEditing}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </HStack>
        <Button
          onClick={handleViewSubscriptions}
          size="sm"
          variant="outline"
          disabled={!selectedContact || activeSubscriptionsCount === 0}
        >
          <FileText className="h-4 w-4 mr-2" />
          Subscription {activeSubscriptionsCount > 0 && `(${activeSubscriptionsCount})`}
        </Button>
      </Flex>

      <Card>
        <CardHeader>
          <CardTitle>{selectedContact ? 'Edit Contact' : 'New Contact'}</CardTitle>
        </CardHeader>
        <CardContent>
          <VStack spacing={4} align="stretch">
            <Box>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
                disabled={!isEditing}
              />
            </Box>

            <Box>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
                disabled={!isEditing || !!selectedContact}
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
    </Box>
  );
}
