import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  useToast,
} from '@chakra-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function UserDetailsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', user?.id],
    queryFn: () => userApi.get(user!.id),
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; phone?: string; address?: string }) =>
      userApi.updateProfile(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update profile',
        status: 'error',
        duration: 5000,
      });
    },
  });

  useEffect(() => {
    if (userData?.data.user) {
      const u = userData.data.user;
      setFormData({
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        address: u.address || '',
      });
    }
  }, [userData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    updateMutation.mutate({
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
    });
  };

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      <Heading as="h1" size="xl" mb={6}>
        User Details
      </Heading>

      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text mb={2} fontWeight="semibold">
                User Name *
              </Text>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your name"
              />
            </Box>

            <Box>
              <Text mb={2} fontWeight="semibold">
                Email *
              </Text>
              <Input
                type="email"
                value={formData.email}
                isDisabled
                placeholder="Enter your email"
              />
            </Box>

            <Box>
              <Text mb={2} fontWeight="semibold">
                Phone Number *
              </Text>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </Box>

            <Box>
              <Text mb={2} fontWeight="semibold">
                Address *
              </Text>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your address"
              />
            </Box>

            <Text fontSize="sm" color="gray.600" mt={2}>
              Other details following related to user
            </Text>

            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={updateMutation.isPending}
              mt={4}
            >
              Save Changes
            </Button>
          </VStack>
        </CardContent>
      </Card>
    </Box>
  );
}
