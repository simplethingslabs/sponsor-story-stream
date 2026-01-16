import { Router } from 'express';
import * as registrationsController from '../controllers/registrationsController';
import { authenticate } from '../middleware/auth';
import { requireAnyRole } from '../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(requireAnyRole(['super_admin', 'admin']));

router.get('/', registrationsController.getPendingRegistrations);
router.get('/:id', registrationsController.getPendingRegistration);
router.post('/:id/approve', registrationsController.approveRegistration);
router.post('/:id/reject', registrationsController.rejectRegistration);
router.post('/batch-approve', registrationsController.batchApproveRegistrations);

export default router;
