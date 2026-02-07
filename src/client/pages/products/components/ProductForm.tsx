import { VStack, Box, Image, Text } from '@chakra-ui/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface ProductFormProps {
  initialData?: {
    name: string;
    description?: string;
    imageUrl?: string;
  };
  onSubmit: (data: { name: string; description?: string; image?: File }) => void;
  isLoading?: boolean;
}

export function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const [name, setName] = useState(initialData?.name || '');
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
      description: description || undefined,
      image: imageFile || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter product name"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter product description"
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="image">Product Image</Label>
          {imagePreview ? (
            <Box position="relative" mt={2}>
              <Image
                src={imagePreview}
                alt="Product preview"
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
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isLoading}
                style={{ display: 'none' }}
              />
              <Label htmlFor="image" style={{ cursor: 'pointer' }}>
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <Text fontSize="sm" color="gray.600">
                  Click to upload product image
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
