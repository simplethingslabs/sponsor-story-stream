import { useState, useCallback } from 'react';
import { Upload, X, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export interface ImageFile {
  id: string;
  file?: File;
  url: string;
  caption?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}

interface ImageUploadProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  showCaptions?: boolean;
  uploadEndpoint?: string;
  className?: string;
  gridCols?: 2 | 3 | 4;
  aspectRatio?: 'square' | 'video' | 'auto';
  placeholder?: string;
}

export function ImageUpload({
  images,
  onChange,
  multiple = true,
  maxFiles = 10,
  maxSize = 5,
  showCaptions = false,
  uploadEndpoint,
  className,
  gridCols = 3,
  aspectRatio = 'auto',
  placeholder = 'Add photos',
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'File must be an image';
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (uploadEndpoint) {
      const response = await api.uploadFile(uploadEndpoint, file);
      if (response.error) throw new Error(response.error);
      return response.data?.url || '';
    }
    // For now, use object URL (local preview)
    return URL.createObjectURL(file);
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const availableSlots = maxFiles - images.length;
    const filesToProcess = fileArray.slice(0, availableSlots);

    const newImages: ImageFile[] = filesToProcess
      .filter((file) => !validateFile(file))
      .map((file) => ({
        id: generateId(),
        file,
        url: URL.createObjectURL(file),
        caption: '',
        isUploading: !!uploadEndpoint,
      }));

    let currentImages = [...images, ...newImages];
    onChange(currentImages);

    // Upload files if endpoint provided
    if (uploadEndpoint) {
      for (const img of newImages) {
        try {
          const url = await uploadFile(img.file!);
          currentImages = currentImages.map((i) =>
            i.id === img.id ? { ...i, url, isUploading: false } : i
          );
          onChange(currentImages);
        } catch (error) {
          // Remove failed upload
          currentImages = currentImages.filter((i) => i.id !== img.id);
          onChange(currentImages);
        }
      }
    }
  }, [images, maxFiles, uploadEndpoint, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (id: string) => {
    const img = images.find((i) => i.id === id);
    if (img?.url.startsWith('blob:')) {
      URL.revokeObjectURL(img.url);
    }
    onChange(images.filter((i) => i.id !== id));
  };

  const updateCaption = (id: string, caption: string) => {
    onChange(images.map((i) => (i.id === id ? { ...i, caption } : i)));
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      default:
        return 'h-32';
    }
  };

  const getGridClass = () => {
    switch (gridCols) {
      case 2:
        return 'grid-cols-2';
      case 4:
        return 'grid-cols-2 md:grid-cols-4';
      default:
        return 'grid-cols-2 md:grid-cols-3';
    }
  };

  const canAddMore = images.length < maxFiles;

  return (
    <div className={cn('space-y-4', className)}>
      {images.length > 0 && (
        <div className={cn('grid gap-4', getGridClass())}>
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className={cn('relative overflow-hidden rounded-lg bg-muted', getAspectClass())}>
                <img
                  src={image.url}
                  alt={image.caption || 'Uploaded image'}
                  className="w-full h-full object-cover"
                />
                {image.isUploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(image.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {showCaptions && (
                <Input
                  placeholder="Add caption..."
                  className="mt-2 text-sm"
                  value={image.caption || ''}
                  onChange={(e) => updateCaption(image.id, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <label
          className={cn(
            'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 bg-muted/50 hover:bg-muted'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-4">
            {images.length === 0 ? (
              <>
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {multiple ? `Up to ${maxFiles} images` : 'Single image'} (max {maxSize}MB each)
                </p>
              </>
            ) : (
              <>
                <Plus className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{placeholder}</p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple={multiple}
            onChange={handleInputChange}
          />
        </label>
      )}
    </div>
  );
}
