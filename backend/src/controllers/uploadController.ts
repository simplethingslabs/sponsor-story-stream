import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';

// Upload image
export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { folder = 'general', transformation } = req.body;
    
    // Convert buffer to base64
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Build upload options
    const options: any = {
      folder: `sponsor-portal/${folder}`,
      resource_type: 'image',
    };
    
    // Apply transformation if specified
    if (transformation === 'avatar') {
      options.transformation = [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
      ];
    } else if (transformation === 'thumbnail') {
      options.transformation = [
        { width: 400, height: 300, crop: 'fill' },
        { quality: 'auto' },
      ];
    }
    
    const result: UploadApiResponse = await cloudinary.uploader.upload(base64, options);
    
    res.json({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error) {
    next(error);
  }
}

// Upload document (PDF, etc.)
export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { folder = 'documents' } = req.body;
    
    // Convert buffer to base64
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    const result: UploadApiResponse = await cloudinary.uploader.upload(base64, {
      folder: `sponsor-portal/${folder}`,
      resource_type: 'raw',
    });
    
    res.json({
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    next(error);
  }
}

// Upload video
export async function uploadVideo(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { folder = 'videos' } = req.body;
    
    // Convert buffer to base64
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    const result: UploadApiResponse = await cloudinary.uploader.upload(base64, {
      folder: `sponsor-portal/${folder}`,
      resource_type: 'video',
      eager: [
        { width: 640, height: 360, crop: 'fill' }, // Create thumbnail
      ],
    });
    
    res.json({
      url: result.secure_url,
      public_id: result.public_id,
      duration: result.duration,
      format: result.format,
      thumbnail_url: result.eager?.[0]?.secure_url,
    });
  } catch (error) {
    next(error);
  }
}

// Delete file
export async function deleteFile(req: Request, res: Response, next: NextFunction) {
  try {
    const { public_id } = req.params;
    const { resource_type = 'image' } = req.query;
    
    await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type as string,
    });
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Generate upload signature (for direct client uploads)
export async function getUploadSignature(req: Request, res: Response, next: NextFunction) {
  try {
    const { folder = 'general' } = req.query;
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: `sponsor-portal/${folder}`,
      },
      process.env.CLOUDINARY_API_SECRET!
    );
    
    res.json({
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder: `sponsor-portal/${folder}`,
    });
  } catch (error) {
    next(error);
  }
}
