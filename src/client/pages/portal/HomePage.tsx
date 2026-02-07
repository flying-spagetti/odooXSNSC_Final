import { Box, Heading, Text } from '@chakra-ui/react';

export default function HomePage() {
  return (
    <Box>
      <Heading as="h1" size="2xl" mb={4} textAlign="center">
        HOME Page
      </Heading>
      <Text textAlign="center" color="gray.600">
        Welcome to our subscription management portal
      </Text>
    </Box>
  );
}
