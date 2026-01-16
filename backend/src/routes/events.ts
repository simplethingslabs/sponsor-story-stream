import { Router } from 'express';
import * as eventsController from '../controllers/eventsController';
import { authenticate } from '../middleware/auth';
import { requireAnyRole } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validate';
import { createEventSchema, updateEventSchema, eventQuerySchema, batchDeleteEventsSchema } from '../schemas/event';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(eventQuerySchema), eventsController.getEvents);
router.get('/upcoming', eventsController.getUpcomingEvents);
router.get('/:id', eventsController.getEvent);
router.post('/', requireAnyRole(['super_admin', 'admin']), validateBody(createEventSchema), auditLog('events'), eventsController.createEvent);
router.put('/:id', requireAnyRole(['super_admin', 'admin']), validateBody(updateEventSchema), auditLog('events'), eventsController.updateEvent);
router.delete('/:id', requireAnyRole(['super_admin', 'admin']), auditLog('events'), eventsController.deleteEvent);
router.post('/:id/restore', requireAnyRole(['super_admin', 'admin']), auditLog('events'), eventsController.restoreEvent);
router.post('/batch-delete', requireAnyRole(['super_admin', 'admin']), validateBody(batchDeleteEventsSchema), eventsController.batchDeleteEvents);

export default router;
