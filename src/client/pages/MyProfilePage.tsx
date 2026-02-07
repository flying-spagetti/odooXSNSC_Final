import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, SimpleGrid, VStack } from '@chakra-ui/react';
import { User, Shield, Mail, Calendar, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export default function MyProfilePage() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  if (!user) {
    return (
      <Box>
        <p className="text-center text-muted-foreground py-12">Not logged in</p>
      </Box>
    );
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-800',
    INTERNAL: 'bg-blue-100 text-blue-800',
    PORTAL: 'bg-green-100 text-green-800',
  };

  const roleDescriptions: Record<string, string> = {
    ADMIN: 'Full access to all features including user management, products, configuration, and reports.',
    INTERNAL: 'Can manage subscriptions, invoices, and payments. Can view products, plans, and reports.',
    PORTAL: 'Customer portal access. Can view own subscriptions and invoices.',
  };

  return (
    <Box className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View and manage your account information</p>
      </div>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <VStack spacing={5} align="stretch">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{user.name}</h3>
                  <Badge className={roleColors[user.role] || 'bg-gray-100 text-gray-800'}>
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Flex align="center" gap={3} className="p-3 bg-gray-50 rounded-md">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </Flex>

                <Flex align="center" gap={3} className="p-3 bg-gray-50 rounded-md">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="font-medium">{user.role}</p>
                  </div>
                </Flex>

                <Flex align="center" gap={3} className="p-3 bg-gray-50 rounded-md">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </Flex>
              </div>
            </VStack>
          </CardContent>
        </Card>

        {/* Role & Permissions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role & Permissions
            </CardTitle>
            <CardDescription>What you can do in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <VStack spacing={4} align="stretch">
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="font-semibold mb-2">{user.role} Role</p>
                <p className="text-sm text-muted-foreground">
                  {roleDescriptions[user.role] || 'Standard access.'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Your Capabilities:</p>
                {user.role === 'ADMIN' && (
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Manage users and contacts</li>
                    <li>Create and manage products</li>
                    <li>Configure tax rates, discounts, and plans</li>
                    <li>Full subscription lifecycle management</li>
                    <li>Invoice and payment management</li>
                    <li>Access reports and analytics</li>
                  </ul>
                )}
                {user.role === 'INTERNAL' && (
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Create and manage subscriptions</li>
                    <li>Invoice and payment management</li>
                    <li>View products and plans</li>
                    <li>Access reports and analytics</li>
                  </ul>
                )}
                {user.role === 'PORTAL' && (
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>View your subscriptions</li>
                    <li>View your invoices</li>
                    <li>View available products</li>
                  </ul>
                )}
              </div>
            </VStack>
          </CardContent>
        </Card>
      </SimpleGrid>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Flex gap={3}>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </Flex>
        </CardContent>
      </Card>
    </Box>
  );
}
