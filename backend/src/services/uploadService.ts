import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface UploadOptions {
  folder?: string;
  transformation?: 'avatar' | 'thumbnail' | 'report' | 'newsletter';
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  duration?: number;
  thumbnailUrl?: string;
}

// Transformation presets
const transformations = {
  avatar: [
    { width: 200, height: 200, crop: 'fill', gravity: 'face' },
    { quality: 'auto', fetch_format: 'auto' },
  ],
  thumbnail: [
    { width: 400, height: 300, crop: 'fill' },
    { quality: 'auto', fetch_format: 'auto' },
  ],
  report: [
    { width: 800, crop: 'limit' },
    { quality: 'auto', fetch_format: 'auto' },
  ],
  newsletter: [
    { width: 1200, crop: 'limit' },
    { quality: 'auto', fetch_format: 'auto' },
  ],
};

// Upload from base64
export async function uploadBase64(
  base64Data: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const uploadOptions: any = {
    folder: `sponsor-portal/${options.folder || 'general'}`,
    resource_type: options.resourceType || 'auto',
  };
  
  if (options.transformation && transformations[options.transformation]) {
    uploadOptions.transformation = transformations[options.transformation];
  }
  
  const result: UploadApiResponse = await cloudinary.uploader.upload(base64Data, uploadOptions);
  
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
    duration: result.duration,
  };
}

// Upload from URL
export async function uploadFromUrl(
  url: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const uploadOptions: any = {
    folder: `sponsor-portal/${options.folder || 'general'}`,
    resource_type: options.resourceType || 'auto',
  };
  
  if (options.transformation && transformations[options.transformation]) {
    uploadOptions.transformation = transformations[options.transformation];
  }
  
  const result: UploadApiResponse = await cloudinary.uploader.upload(url, uploadOptions);
  
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

// Delete file
export async function deleteFile(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

// Generate signed upload URL for direct client uploads
export function generateUploadSignature(
  folder: string = 'general'
): { signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string } {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: `sponsor-portal/${folder}` },
    process.env.CLOUDINARY_API_SECRET!
  );
  
  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder: `sponsor-portal/${folder}`,
  };
}

// Get optimized URL with transformations
export function getOptimizedUrl(
  publicId: string,
  transformation: keyof typeof transformations
): string {
  return cloudinary.url(publicId, {
    transformation: transformations[transformation],
    secure: true,
  });
}
