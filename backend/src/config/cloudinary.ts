import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Verify configuration
export function verifyCloudinaryConfig(): boolean {
  const config = cloudinary.config();
  return !!(config.cloud_name && config.api_key && config.api_secret);
}

// Upload presets for different file types
export const uploadPresets = {
  avatar: {
    folder: 'sponsor-portal/avatars',
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  },
  childPhoto: {
    folder: 'sponsor-portal/children',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  },
  reportMedia: {
    folder: 'sponsor-portal/reports',
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  },
  eventMedia: {
    folder: 'sponsor-portal/events',
    transformation: [
      { width: 1600, height: 1200, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  },
  newsletter: {
    folder: 'sponsor-portal/newsletters',
    resource_type: 'raw' as const,
  },
  newsletterThumbnail: {
    folder: 'sponsor-portal/newsletter-thumbnails',
    transformation: [
      { width: 300, height: 400, crop: 'fill' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  },
  document: {
    folder: 'sponsor-portal/documents',
    resource_type: 'raw' as const,
  },
};

export default cloudinary;
