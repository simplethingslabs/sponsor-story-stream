import { Router } from 'express';
import * as newslettersController from '../controllers/newslettersController';
import { authenticate } from '../middleware/auth';
import { requireAnyRole } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validate';
import { createNewsletterSchema, updateNewsletterSchema, newsletterQuerySchema, batchDeleteNewslettersSchema } from '../schemas/newsletter';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(newsletterQuerySchema), newslettersController.getNewsletters);
router.get('/:id', newslettersController.getNewsletter);
router.post('/', requireAnyRole(['super_admin', 'admin']), validateBody(createNewsletterSchema), auditLog('newsletters'), newslettersController.createNewsletter);
router.put('/:id', requireAnyRole(['super_admin', 'admin']), validateBody(updateNewsletterSchema), auditLog('newsletters'), newslettersController.updateNewsletter);
router.delete('/:id', requireAnyRole(['super_admin', 'admin']), auditLog('newsletters'), newslettersController.deleteNewsletter);
router.post('/:id/restore', requireAnyRole(['super_admin', 'admin']), auditLog('newsletters'), newslettersController.restoreNewsletter);
router.post('/batch-delete', requireAnyRole(['super_admin', 'admin']), validateBody(batchDeleteNewslettersSchema), newslettersController.batchDeleteNewsletters);

export default router;
