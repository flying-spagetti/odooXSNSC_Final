import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Box, Flex, Spinner, Text } from '@chakra-ui/react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuthStore();

  // Show a loading spinner while the JWT is being verified on startup
  if (isInitializing) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <Box textAlign="center">
          <Spinner size="xl" color="blue.500" thickness="4px" mb={4} />
          <Text color="gray.500" fontSize="sm">Verifying session…</Text>
        </Box>
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
