import { VStack } from '@chakra-ui/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface VariantFormProps {
  initialData?: {
    name: string;
    sku: string;
    basePrice: number;
    description?: string;
  };
  onSubmit: (data: { name: string; sku: string; basePrice: number; description?: string }) => void;
  isLoading?: boolean;
}

export function VariantForm({ initialData, onSubmit, isLoading }: VariantFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [basePrice, setBasePrice] = useState(initialData?.basePrice?.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      sku,
      basePrice: parseFloat(basePrice),
      description: description || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <div>
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
            placeholder="e.g., PROD-001"
            required
            disabled={isLoading || !!initialData}
          />
        </div>

        <div>
          <Label htmlFor="variant-name">Variant Name *</Label>
          <Input
            id="variant-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter variant name"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="basePrice">Base Price *</Label>
          <Input
            id="basePrice"
            type="number"
            step="0.01"
            min="0"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="0.00"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="variant-description">Description</Label>
          <Input
            id="variant-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter variant description"
            disabled={isLoading}
          />
        </div>
      </VStack>
    </form>
  );
}
