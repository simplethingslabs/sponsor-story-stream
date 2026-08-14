import { z } from 'zod';
import { sanitizeString } from '../utils/helpers';

// Create child schema
export const createChildSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .transform(val => sanitizeString(val)),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .transform(val => sanitizeString(val)),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(val => {
      const date = new Date(val);
      const now = new Date();
      const minAge = new Date(now.getFullYear() - 25, now.getMonth(), now.getDate());
      const maxAge = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
      return date >= minAge && date <= maxAge;
    }, 'Child must be between 3 and 25 years old'),
  grade: z
    .string()
    .min(1, 'Grade is required')
    .max(20, 'Grade must be less than 20 characters')
    .transform(val => sanitizeString(val)),
  photo_url: z
    .string()
    .url('Invalid photo URL')
    .max(500, 'Photo URL must be less than 500 characters')
    .optional()
    .nullable(),
  enrollment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  status: z
    .enum(['active', 'graduated', 'withdrawn'])
    .default('active'),
  teacher_id: z
    .string()
    .uuid('Invalid teacher ID')
    .optional()
    .nullable(),
});

// Update child schema (all fields optional)
export const updateChildSchema = createChildSchema.partial();

// Batch create children schema
export const batchCreateChildrenSchema = z.object({
  children: z.array(createChildSchema).min(1, 'At least one child is required').max(100, 'Maximum 100 children per batch'),
});

// Batch delete children schema
export const batchDeleteChildrenSchema = z.object({
  ids: z.array(z.string().uuid('Invalid child ID')).min(1, 'At least one ID is required').max(100, 'Maximum 100 IDs per batch'),
});

// Child query params schema
export const childQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(100).optional(),
  status: z.enum(['active', 'graduated', 'withdrawn', 'all']).default('all'),
  grade: z.string().max(20).optional(),
  sort_by: z.enum(['first_name', 'last_name', 'date_of_birth', 'grade', 'enrollment_date', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  include_deleted: z.coerce.boolean().default(false),
});

// Types
export type CreateChildInput = z.infer<typeof createChildSchema>;
export type UpdateChildInput = z.infer<typeof updateChildSchema>;
export type BatchCreateChildrenInput = z.infer<typeof batchCreateChildrenSchema>;
export type BatchDeleteChildrenInput = z.infer<typeof batchDeleteChildrenSchema>;
export type ChildQueryInput = z.infer<typeof childQuerySchema>;
