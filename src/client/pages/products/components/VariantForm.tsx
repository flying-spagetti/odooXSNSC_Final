import { VStack, Box, Image, Text } from '@chakra-ui/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface VariantFormProps {
  initialData?: {
    name: string;
    sku: string;
    basePrice: number;
    description?: string;
    imageUrl?: string;
  };
  onSubmit: (data: { name: string; sku: string; basePrice: number; description?: string; image?: File }) => void;
  isLoading?: boolean;
}

export function VariantForm({ initialData, onSubmit, isLoading }: VariantFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [basePrice, setBasePrice] = useState(initialData?.basePrice?.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      sku,
      basePrice: parseFloat(basePrice),
      description: description || undefined,
      image: imageFile || undefined,
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

        <div>
          <Label htmlFor="variant-image">Variant Image</Label>
          {imagePreview ? (
            <Box position="relative" mt={2}>
              <Image
                src={imagePreview}
                alt="Variant preview"
                maxH="200px"
                borderRadius="md"
                objectFit="cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                position="absolute"
                top={2}
                right={2}
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </Box>
          ) : (
            <Box
              border="2px dashed"
              borderColor="gray.300"
              borderRadius="md"
              p={6}
              textAlign="center"
              mt={2}
            >
              <Input
                id="variant-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isLoading}
                style={{ display: 'none' }}
              />
              <Label htmlFor="variant-image" style={{ cursor: 'pointer' }}>
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <Text fontSize="sm" color="gray.600">
                  Click to upload variant image
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  PNG, JPG, WEBP up to 5MB
                </Text>
              </Label>
            </Box>
          )}
        </div>
      </VStack>
    </form>
  );
}
