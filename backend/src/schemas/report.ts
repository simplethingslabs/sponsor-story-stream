import { z } from 'zod';
import { sanitizeString } from '../utils/helpers';

// Create report schema
export const createReportSchema = z.object({
  child_id: z.string().uuid('Invalid child ID'),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4'], {
    errorMap: () => ({ message: 'Quarter must be Q1, Q2, Q3, or Q4' }),
  }),
  year: z
    .number()
    .int()
    .min(2000, 'Year must be 2000 or later')
    .max(2100, 'Year must be 2100 or earlier'),
  growth_narrative: z
    .string()
    .min(10, 'Growth narrative must be at least 10 characters')
    .max(5000, 'Growth narrative must be less than 5000 characters')
    .transform(val => sanitizeString(val)),
  activities: z
    .string()
    .min(10, 'Activities must be at least 10 characters')
    .max(5000, 'Activities must be less than 5000 characters')
    .transform(val => sanitizeString(val)),
  teacher_observations: z
    .string()
    .min(10, 'Teacher observations must be at least 10 characters')
    .max(5000, 'Teacher observations must be less than 5000 characters')
    .transform(val => sanitizeString(val)),
  status: z.enum(['draft', 'pending_review']).default('draft'),
  media: z
    .array(
      z.object({
        type: z.enum(['image', 'video', 'audio', 'document']),
        url: z.string().url('Invalid media URL').max(500),
        caption: z.string().max(500).optional().nullable(),
        order: z.number().int().min(0).max(100),
      })
    )
    .max(20, 'Maximum 20 media items per report')
    .optional(),
});

// Update report schema
export const updateReportSchema = createReportSchema.partial().omit({ child_id: true });

// Publish report schema
export const publishReportSchema = z.object({
  notify_sponsors: z.boolean().default(true),
});

// Batch publish reports schema
export const batchPublishReportsSchema = z.object({
  ids: z.array(z.string().uuid('Invalid report ID')).min(1).max(100),
  notify_sponsors: z.boolean().default(true),
});

// Batch delete reports schema
export const batchDeleteReportsSchema = z.object({
  ids: z.array(z.string().uuid('Invalid report ID')).min(1).max(100),
});

// Report query params schema
export const reportQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  child_id: z.string().uuid().optional(),
  teacher_id: z.string().uuid().optional(),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']).optional(),
  year: z.coerce.number().int().optional(),
  status: z.enum(['draft', 'pending_review', 'needs_revision', 'approved', 'published', 'all']).default('all'),
  sort_by: z.enum(['created_at', 'updated_at', 'quarter', 'year', 'published_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  include_deleted: z.coerce.boolean().default(false),
});

// Types
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type PublishReportInput = z.infer<typeof publishReportSchema>;
export type BatchPublishReportsInput = z.infer<typeof batchPublishReportsSchema>;
export type BatchDeleteReportsInput = z.infer<typeof batchDeleteReportsSchema>;
export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
