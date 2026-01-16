import { Router } from 'express';
import * as trashController from '../controllers/trashController';
import { authenticate } from '../middleware/auth';
import { requireAnyRole, requireRole } from '../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(requireAnyRole(['super_admin', 'admin']));

router.get('/', trashController.getTrash);
router.post('/:entity_type/:id/restore', trashController.restoreItem);
router.delete('/:entity_type/:id', requireRole('super_admin'), trashController.permanentlyDelete);
router.delete('/', requireRole('super_admin'), trashController.emptyTrash);

export default router;
