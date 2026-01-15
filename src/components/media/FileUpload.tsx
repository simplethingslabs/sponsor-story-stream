import { useState, useCallback } from 'react';
import { Upload, X, FileText, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export interface UploadedFile {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  url: string;
  isUploading?: boolean;
}

interface FileUploadProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  accept?: string;
  acceptLabel?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  uploadEndpoint?: string;
  className?: string;
}

const FILE_ICONS: Record<string, typeof FileText> = {
  'application/pdf': FileText,
  default: File,
};

export function FileUpload({
  files,
  onChange,
  accept = '*/*',
  acceptLabel,
  multiple = false,
  maxFiles = 5,
  maxSize = 10,
  uploadEndpoint,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getAcceptedTypes = (): string[] => {
    if (accept === '*/*') return [];
    return accept.split(',').map((t) => t.trim());
  };

  const validateFile = (file: File): string | null => {
    const acceptedTypes = getAcceptedTypes();
    
    if (acceptedTypes.length > 0) {
      const isValidType = acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', ''));
        }
        return file.type === type || file.name.endsWith(type.replace('.', ''));
      });
      if (!isValidType) {
        return `Invalid file type. Accepted: ${acceptLabel || accept}`;
      }
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
    return URL.createObjectURL(file);
  };

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(fileList);
    const availableSlots = maxFiles - files.length;
    const filesToProcess = fileArray.slice(0, availableSlots);

    const validFiles: UploadedFile[] = [];
    
    for (const file of filesToProcess) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      
      validFiles.push({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        isUploading: !!uploadEndpoint,
      });
    }

    if (validFiles.length === 0) return;

    let currentFiles = multiple ? [...files, ...validFiles] : validFiles;
    onChange(currentFiles);

    // Upload files if endpoint provided
    if (uploadEndpoint) {
      for (const uploadedFile of validFiles) {
        try {
          const url = await uploadFile(uploadedFile.file!);
          currentFiles = currentFiles.map((f) =>
            f.id === uploadedFile.id ? { ...f, url, isUploading: false } : f
          );
          onChange(currentFiles);
        } catch (err) {
          currentFiles = currentFiles.filter((f) => f.id !== uploadedFile.id);
          onChange(currentFiles);
          setError('Upload failed. Please try again.');
        }
      }
    }
  }, [files, maxFiles, multiple, uploadEndpoint, onChange]);

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

  const removeFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url);
    }
    onChange(files.filter((f) => f.id !== id));
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getFileIcon = (type: string) => {
    const Icon = FILE_ICONS[type] || FILE_ICONS.default;
    return Icon;
  };

  const canAddMore = files.length < maxFiles;
  const showUploadZone = multiple ? canAddMore : files.length === 0;

  return (
    <div className={cn('space-y-4', className)}>
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileIcon className="w-10 h-10 flex-shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUploadZone && (
        <label
          className={cn(
            'flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 bg-muted/50 hover:bg-muted',
            error && 'border-destructive'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptLabel || accept} (max {maxSize}MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
          />
        </label>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
