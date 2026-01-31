import { z } from 'zod';

export const createPaymentSchema = z.object({
  sponsor_id: z.string().uuid('Invalid sponsor ID'),
  child_id: z.string().uuid('Invalid child ID').optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('INR'),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
  payment_method: z.enum(['upi', 'bank_transfer', 'cheque', 'cash']).optional().nullable(),
  payment_date: z.string().optional().nullable(),
  due_date: z.string(),
  reference_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updatePaymentSchema = z.object({
  sponsor_id: z.string().uuid('Invalid sponsor ID').optional(),
  child_id: z.string().uuid('Invalid child ID').optional().nullable(),
  amount: z.number().positive('Amount must be positive').optional(),
  currency: z.string().length(3).optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  payment_method: z.enum(['upi', 'bank_transfer', 'cheque', 'cash']).optional().nullable(),
  payment_date: z.string().optional().nullable(),
  due_date: z.string().optional(),
  reference_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const markPaidSchema = z.object({
  payment_method: z.enum(['upi', 'bank_transfer', 'cheque', 'cash']),
  payment_date: z.string().optional(),
  reference_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;
