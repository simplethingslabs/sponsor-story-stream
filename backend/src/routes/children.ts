import { Router } from 'express';
import * as childrenController from '../controllers/childrenController';
import { authenticate } from '../middleware/auth';
import { requireRole, requireAnyRole } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validate';
import { createChildSchema, updateChildSchema, batchCreateChildrenSchema, batchDeleteChildrenSchema, childQuerySchema } from '../schemas/child';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', requireAnyRole(['super_admin', 'admin', 'teacher']), validateQuery(childQuerySchema), childrenController.getChildren);
router.get('/my-children', requireRole('sponsor'), childrenController.getChildrenForSponsor);
router.get('/:id', requireAnyRole(['super_admin', 'admin', 'teacher']), childrenController.getChild);
router.post('/', requireAnyRole(['super_admin', 'admin']), validateBody(createChildSchema), auditLog('children'), childrenController.createChild);
router.put('/:id', requireAnyRole(['super_admin', 'admin']), validateBody(updateChildSchema), auditLog('children'), childrenController.updateChild);
router.delete('/:id', requireAnyRole(['super_admin', 'admin']), auditLog('children'), childrenController.deleteChild);
router.post('/:id/restore', requireAnyRole(['super_admin', 'admin']), auditLog('children'), childrenController.restoreChild);
router.post('/batch', requireAnyRole(['super_admin', 'admin']), validateBody(batchCreateChildrenSchema), childrenController.batchCreateChildren);
router.post('/batch-delete', requireAnyRole(['super_admin', 'admin']), validateBody(batchDeleteChildrenSchema), childrenController.batchDeleteChildren);

export default router;
