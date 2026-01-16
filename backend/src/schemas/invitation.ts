import { z } from 'zod';
import { sanitizeString } from '../utils/helpers';

// Send invitation schema
export const sendInvitationSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .transform(val => val.toLowerCase().trim()),
  personal_message: z
    .string()
    .max(1000, 'Personal message must be less than 1000 characters')
    .optional()
    .nullable()
    .transform(val => val ? sanitizeString(val) : val),
});

// Batch send invitations schema
export const batchSendInvitationsSchema = z.object({
  invitations: z
    .array(sendInvitationSchema)
    .min(1, 'At least one invitation is required')
    .max(50, 'Maximum 50 invitations per batch'),
});

// Cancel invitation schema
export const cancelInvitationSchema = z.object({
  id: z.string().uuid('Invalid invitation ID'),
});

// Resend invitation schema
export const resendInvitationSchema = z.object({
  id: z.string().uuid('Invalid invitation ID'),
});

// Invitation query params schema
export const invitationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['pending', 'accepted', 'expired', 'all']).default('all'),
  search: z.string().max(100).optional(),
  sort_by: z.enum(['created_at', 'expires_at', 'email']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type SendInvitationInput = z.infer<typeof sendInvitationSchema>;
export type BatchSendInvitationsInput = z.infer<typeof batchSendInvitationsSchema>;
export type CancelInvitationInput = z.infer<typeof cancelInvitationSchema>;
export type ResendInvitationInput = z.infer<typeof resendInvitationSchema>;
export type InvitationQueryInput = z.infer<typeof invitationQuerySchema>;
