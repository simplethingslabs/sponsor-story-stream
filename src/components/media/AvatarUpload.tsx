import { useState, useRef } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface AvatarUploadProps {
  value?: string;
  onChange: (url: string) => void;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  uploadEndpoint?: string;
  className?: string;
  disabled?: boolean;
}

export function AvatarUpload({
  value,
  onChange,
  name,
  size = 'lg',
  uploadEndpoint,
  className,
  disabled = false,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-20 w-20',
    lg: 'h-24 w-24',
    xl: 'h-32 w-32',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  const getInitials = (name?: string): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      if (uploadEndpoint) {
        const response = await api.uploadFile(uploadEndpoint, file);
        if (response.error) throw new Error(response.error);
        onChange(response.data?.url || '');
      } else {
        // Local preview
        const url = URL.createObjectURL(file);
        onChange(url);
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }

    // Reset input
    e.target.value = '';
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative">
        <Avatar className={cn(sizeClasses[size], 'border-2 border-muted')}>
          <AvatarImage src={value} alt={name || 'Avatar'} />
          <AvatarFallback className="bg-muted">
            {name ? getInitials(name) : <User className={iconSizes[size]} />}
          </AvatarFallback>
        </Avatar>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className={cn(
            'absolute bottom-0 right-0 rounded-full shadow-md',
            size === 'sm' && 'h-6 w-6',
            size === 'md' && 'h-7 w-7',
            size === 'lg' && 'h-8 w-8',
            size === 'xl' && 'h-10 w-10'
          )}
          onClick={handleClick}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <Loader2 className={cn('animate-spin', iconSizes[size === 'xl' ? 'lg' : 'sm'])} />
          ) : (
            <Camera className={iconSizes[size === 'xl' ? 'lg' : 'sm']} />
          )}
        </Button>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
