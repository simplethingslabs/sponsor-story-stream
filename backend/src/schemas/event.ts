import { z } from 'zod';
import { sanitizeString } from '../utils/helpers';

// Create event schema
export const createEventSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .transform(val => sanitizeString(val)),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters')
    .transform(val => sanitizeString(val)),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/, 'Invalid date format'),
  location: z
    .string()
    .max(200, 'Location must be less than 200 characters')
    .optional()
    .nullable()
    .transform(val => val ? sanitizeString(val) : val),
  media: z
    .array(
      z.object({
        type: z.enum(['image', 'video']),
        url: z.string().url('Invalid media URL').max(500),
        caption: z.string().max(500).optional().nullable(),
        order: z.number().int().min(0).max(100),
      })
    )
    .max(50, 'Maximum 50 media items per event')
    .optional(),
});

// Update event schema
export const updateEventSchema = createEventSchema.partial();

// Batch delete events schema
export const batchDeleteEventsSchema = z.object({
  ids: z.array(z.string().uuid('Invalid event ID')).min(1).max(100),
});

// Event query params schema
export const eventQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(100).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort_by: z.enum(['event_date', 'created_at', 'title']).default('event_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  include_deleted: z.coerce.boolean().default(false),
});

// Types
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type BatchDeleteEventsInput = z.infer<typeof batchDeleteEventsSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;
