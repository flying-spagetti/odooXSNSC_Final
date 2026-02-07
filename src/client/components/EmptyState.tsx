import { Box, Flex, Text } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-12">
        <Flex direction="column" align="center" justify="center" className="text-center">
          <Box className="mb-4 p-4 bg-muted rounded-full">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </Box>
          <Text className="text-xl font-semibold mb-2">{title}</Text>
          <Text className="text-muted-foreground mb-6 max-w-md">{description}</Text>
          {actionLabel && onAction && (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </Flex>
      </CardContent>
    </Card>
  );
}
