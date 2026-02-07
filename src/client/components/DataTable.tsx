import { ReactNode } from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, Box, Flex, Button as ChakraButton, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  cell?: (value: any, row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    onPageChange: (offset: number) => void;
  };
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  pagination,
  onRowClick,
}: DataTableProps<T>) {
  const currentPage = pagination ? Math.floor(pagination.offset / pagination.limit) + 1 : 1;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  const handlePrevPage = () => {
    if (pagination && pagination.offset > 0) {
      pagination.onPageChange(Math.max(0, pagination.offset - pagination.limit));
    }
  };

  const handleNextPage = () => {
    if (pagination && pagination.offset + pagination.limit < pagination.total) {
      pagination.onPageChange(pagination.offset + pagination.limit);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Text className="text-center text-muted-foreground">Loading...</Text>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <Text className="text-center text-muted-foreground">No data available</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent className="p-0">
          <Box className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr>
                  {columns.map((column, index) => (
                    <Th key={index} className="text-xs font-medium text-muted-foreground uppercase">
                      {column.header}
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {data.map((row) => (
                  <Tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    className={onRowClick ? 'cursor-pointer hover:bg-accent' : ''}
                  >
                    {columns.map((column, colIndex) => {
                      let value: any;
                      if (typeof column.accessor === 'function') {
                        value = column.accessor(row);
                      } else {
                        value = row[column.accessor];
                      }

                      const cellContent = column.cell ? column.cell(value, row) : value;

                      return (
                        <Td key={colIndex} className="text-sm">
                          {cellContent}
                        </Td>
                      );
                    })}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      {pagination && totalPages > 1 && (
        <Flex justify="space-between" align="center" className="mt-4">
          <Text className="text-sm text-muted-foreground">
            Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </Text>
          <Flex gap={2}>
            <ChakraButton
              size="sm"
              onClick={handlePrevPage}
              isDisabled={pagination.offset === 0}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </ChakraButton>
            <Flex align="center" className="px-4">
              <Text className="text-sm">
                Page {currentPage} of {totalPages}
              </Text>
            </Flex>
            <ChakraButton
              size="sm"
              onClick={handleNextPage}
              isDisabled={pagination.offset + pagination.limit >= pagination.total}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </ChakraButton>
          </Flex>
        </Flex>
      )}
    </Box>
  );
}
