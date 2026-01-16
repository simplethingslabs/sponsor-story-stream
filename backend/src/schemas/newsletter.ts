import { z } from 'zod';
import { sanitizeString } from '../utils/helpers';

// Create newsletter schema
export const createNewsletterSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .transform(val => sanitizeString(val)),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable()
    .transform(val => val ? sanitizeString(val) : val),
  file_url: z
    .string()
    .url('Invalid file URL')
    .max(500, 'File URL must be less than 500 characters'),
  thumbnail_url: z
    .string()
    .url('Invalid thumbnail URL')
    .max(500, 'Thumbnail URL must be less than 500 characters')
    .optional()
    .nullable(),
  published_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
});

// Update newsletter schema
export const updateNewsletterSchema = createNewsletterSchema.partial();

// Batch delete newsletters schema
export const batchDeleteNewslettersSchema = z.object({
  ids: z.array(z.string().uuid('Invalid newsletter ID')).min(1).max(100),
});

// Newsletter query params schema
export const newsletterQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(100).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort_by: z.enum(['published_date', 'created_at', 'title']).default('published_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  include_deleted: z.coerce.boolean().default(false),
});

// Types
export type CreateNewsletterInput = z.infer<typeof createNewsletterSchema>;
export type UpdateNewsletterInput = z.infer<typeof updateNewsletterSchema>;
export type BatchDeleteNewslettersInput = z.infer<typeof batchDeleteNewslettersSchema>;
export type NewsletterQueryInput = z.infer<typeof newsletterQuerySchema>;
