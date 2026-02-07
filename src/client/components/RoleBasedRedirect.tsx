import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Box, Flex, Spinner, Text } from '@chakra-ui/react';

export default function RoleBasedRedirect() {
  const { user, isInitializing } = useAuthStore();

  // Wait for auth initialization to complete
  if (isInitializing) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <Box textAlign="center">
          <Spinner size="xl" color="blue.500" thickness="4px" mb={4} />
          <Text color="gray.500" fontSize="sm">Loading...</Text>
        </Box>
      </Flex>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect portal users to portal homepage
  if (user.role === 'PORTAL') {
    return <Navigate to="/portal" replace />;
  }

  // Admin and Internal users go to dashboard
  return <Navigate to="/dashboard" replace />;
}
