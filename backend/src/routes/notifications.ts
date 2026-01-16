import { Router } from 'express';
import * as notificationsController from '../controllers/notificationsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', notificationsController.getNotifications);
router.put('/:id/read', notificationsController.markNotificationRead);
router.put('/mark-all-read', notificationsController.markAllNotificationsRead);
router.delete('/:id', notificationsController.deleteNotification);

export default router;
