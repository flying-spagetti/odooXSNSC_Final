import { Box, Heading, Text } from '@chakra-ui/react';
import { useAuthStore } from '@/store/authStore';


export default function HomePage() {
    const user = useAuthStore(state => state.user);
  return (
    <Box>
      <Heading as="h1" size="2xl" mb={4} textAlign="center" mt={4}>
              <br></br>
        Portal Home Page 
      </Heading>
      <Text textAlign="center" color="gray.600" mt={4}>
        Welcome to our Portal Home Page, {user?.name}
      </Text>
    </Box>
  );
}
