import { z } from 'zod';

// Assign sponsorship schema
export const assignSponsorshipSchema = z.object({
  sponsor_id: z.string().uuid('Invalid sponsor ID'),
  child_id: z.string().uuid('Invalid child ID'),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
});

// Remove sponsorship schema
export const removeSponsorshipSchema = z.object({
  id: z.string().uuid('Invalid sponsorship ID'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
});

// Batch assign sponsorships schema
export const batchAssignSponsorshipsSchema = z.object({
  sponsorships: z
    .array(assignSponsorshipSchema)
    .min(1, 'At least one sponsorship is required')
    .max(100, 'Maximum 100 sponsorships per batch'),
});

// Batch remove sponsorships schema
export const batchRemoveSponsorshipsSchema = z.object({
  ids: z.array(z.string().uuid('Invalid sponsorship ID')).min(1).max(100),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
});

// Update sponsorship schema
export const updateSponsorshipSchema = z.object({
  status: z.enum(['active', 'paused', 'ended']).optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
});

// Sponsorship query params schema
export const sponsorshipQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sponsor_id: z.string().uuid().optional(),
  child_id: z.string().uuid().optional(),
  status: z.enum(['active', 'paused', 'ended', 'all']).default('all'),
  sort_by: z.enum(['start_date', 'created_at', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  include_deleted: z.coerce.boolean().default(false),
});

// Types
export type AssignSponsorshipInput = z.infer<typeof assignSponsorshipSchema>;
export type RemoveSponsorshipInput = z.infer<typeof removeSponsorshipSchema>;
export type BatchAssignSponsorshipsInput = z.infer<typeof batchAssignSponsorshipsSchema>;
export type BatchRemoveSponsorshipsInput = z.infer<typeof batchRemoveSponsorshipsSchema>;
export type UpdateSponsorshipInput = z.infer<typeof updateSponsorshipSchema>;
export type SponsorshipQueryInput = z.infer<typeof sponsorshipQuerySchema>;
