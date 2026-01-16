import { Router } from 'express';
import * as sponsorshipsController from '../controllers/sponsorshipsController';
import { authenticate } from '../middleware/auth';
import { requireAnyRole } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validate';
import { assignSponsorshipSchema, updateSponsorshipSchema, batchAssignSponsorshipsSchema, batchRemoveSponsorshipsSchema, sponsorshipQuerySchema } from '../schemas/sponsorship';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);
router.use(requireAnyRole(['super_admin', 'admin']));

router.get('/', validateQuery(sponsorshipQuerySchema), sponsorshipsController.getSponsorships);
router.post('/assign', validateBody(assignSponsorshipSchema), auditLog('sponsorships'), sponsorshipsController.assignSponsorship);
router.put('/:id', validateBody(updateSponsorshipSchema), auditLog('sponsorships'), sponsorshipsController.updateSponsorship);
router.delete('/:id', auditLog('sponsorships'), sponsorshipsController.removeSponsorship);
router.post('/batch-assign', validateBody(batchAssignSponsorshipsSchema), sponsorshipsController.batchAssignSponsorships);
router.post('/batch-remove', validateBody(batchRemoveSponsorshipsSchema), sponsorshipsController.batchRemoveSponsorships);

export default router;
