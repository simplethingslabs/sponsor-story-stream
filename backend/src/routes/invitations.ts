import { Router } from 'express';
import * as invitationsController from '../controllers/invitationsController';
import { authenticate } from '../middleware/auth';
import { requireAnyRole } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validate';
import { sendInvitationSchema, batchSendInvitationsSchema, invitationQuerySchema } from '../schemas/invitation';

const router = Router();

// Public route to validate invitation token
router.get('/validate/:token', invitationsController.validateInvitation);

// Protected routes
router.use(authenticate);
router.use(requireAnyRole(['super_admin', 'admin']));

router.get('/', validateQuery(invitationQuerySchema), invitationsController.getInvitations);
router.post('/send', validateBody(sendInvitationSchema), invitationsController.sendInvitation);
router.post('/batch-send', validateBody(batchSendInvitationsSchema), invitationsController.batchSendInvitations);
router.post('/:id/resend', invitationsController.resendInvitation);
router.delete('/:id', invitationsController.cancelInvitation);

export default router;
