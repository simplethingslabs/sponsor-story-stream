import { Router } from 'express';
import * as paymentsController from '../controllers/paymentsController';
import { authenticate } from '../middleware/auth';
import { requireAnyRole } from '../middleware/authorize';
import { validateBody } from '../middleware/validate';
import { createPaymentSchema, updatePaymentSchema, markPaidSchema } from '../schemas/payment';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// List payments (admin only)
router.get('/', requireAnyRole(['super_admin', 'admin']), paymentsController.getPayments);

// Get payment stats for dashboard (admin only)
router.get('/stats', requireAnyRole(['super_admin', 'admin']), paymentsController.getPaymentStats);

// Get single payment (admin only)
router.get('/:id', requireAnyRole(['super_admin', 'admin']), paymentsController.getPayment);

// Create new payment (admin only)
router.post('/', requireAnyRole(['super_admin', 'admin']), validateBody(createPaymentSchema), paymentsController.createPayment);

// Update payment (admin only)
router.put('/:id', requireAnyRole(['super_admin', 'admin']), validateBody(updatePaymentSchema), paymentsController.updatePayment);

// Mark payment as paid (admin only)
router.put('/:id/mark-paid', requireAnyRole(['super_admin', 'admin']), validateBody(markPaidSchema), paymentsController.markPaymentPaid);

// Soft delete payment (admin only)
router.delete('/:id', requireAnyRole(['super_admin', 'admin']), paymentsController.deletePayment);

export default router;
