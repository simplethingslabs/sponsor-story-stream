import { Router } from 'express';
import * as reportsController from '../controllers/reportsController';
import { authenticate } from '../middleware/auth';
import { requireAnyRole, requireRole } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validate';
import { createReportSchema, updateReportSchema, reportQuerySchema, batchDeleteReportsSchema } from '../schemas/report';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', requireAnyRole(['super_admin', 'admin', 'teacher']), validateQuery(reportQuerySchema), reportsController.getReports);
router.get('/my-reports', requireRole('sponsor'), reportsController.getReportsForSponsor);
router.get('/:id', reportsController.getReport);
router.post('/', requireAnyRole(['super_admin', 'admin', 'teacher']), validateBody(createReportSchema), auditLog('progress_reports'), reportsController.createReport);
router.put('/:id', requireAnyRole(['super_admin', 'admin', 'teacher']), validateBody(updateReportSchema), auditLog('progress_reports'), reportsController.updateReport);
router.post('/:id/publish', requireAnyRole(['super_admin', 'admin', 'teacher']), auditLog('progress_reports'), reportsController.publishReport);
router.post('/:id/approve', requireAnyRole(['super_admin', 'admin']), auditLog('progress_reports'), reportsController.approveReport);
router.post('/:id/request-revision', requireAnyRole(['super_admin', 'admin']), auditLog('progress_reports'), reportsController.requestRevision);
router.delete('/:id', requireAnyRole(['super_admin', 'admin', 'teacher']), auditLog('progress_reports'), reportsController.deleteReport);
router.post('/:id/restore', requireAnyRole(['super_admin', 'admin']), auditLog('progress_reports'), reportsController.restoreReport);
router.post('/batch-delete', requireAnyRole(['super_admin', 'admin']), validateBody(batchDeleteReportsSchema), reportsController.batchDeleteReports);

export default router;
