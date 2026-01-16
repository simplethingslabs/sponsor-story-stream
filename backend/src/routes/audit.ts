import { Router } from 'express';
import * as auditController from '../controllers/auditController';
import { authenticate } from '../middleware/auth';
import { requireAnyRole } from '../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(requireAnyRole(['super_admin', 'admin']));

router.get('/', auditController.getAuditLogs);
router.get('/tables', auditController.getAuditTableNames);
router.get('/stats', auditController.getAuditStats);
router.get('/:table_name/:record_id', auditController.getRecordAuditLogs);

export default router;
