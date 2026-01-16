import { Router } from 'express';
import * as sponsorsController from '../controllers/sponsorsController';
import { authenticate } from '../middleware/auth';
import { requireAnyRole, requireRole } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', requireAnyRole(['super_admin', 'admin']), sponsorsController.getSponsors);
router.get('/stats', requireRole('sponsor'), sponsorsController.getSponsorStats);
router.get('/:id', requireAnyRole(['super_admin', 'admin']), sponsorsController.getSponsor);
router.put('/:id', requireAnyRole(['super_admin', 'admin']), sponsorsController.updateSponsor);
router.delete('/:id', requireAnyRole(['super_admin', 'admin']), sponsorsController.deleteSponsor);

export default router;
