import { Router } from 'express';
import authRoutes from './auth';
import childrenRoutes from './children';
import sponsorsRoutes from './sponsors';
import sponsorshipsRoutes from './sponsorships';
import reportsRoutes from './reports';
import eventsRoutes from './events';
import newslettersRoutes from './newsletters';
import invitationsRoutes from './invitations';
import registrationsRoutes from './registrations';
import notificationsRoutes from './notifications';
import auditRoutes from './audit';
import uploadRoutes from './upload';
import trashRoutes from './trash';
import paymentsRoutes from './payments';
import attendanceRoutes from './attendance';

const router = Router();

router.use('/auth', authRoutes);
router.use('/children', childrenRoutes);
router.use('/sponsors', sponsorsRoutes);
router.use('/sponsorships', sponsorshipsRoutes);
router.use('/reports', reportsRoutes);
router.use('/events', eventsRoutes);
router.use('/newsletters', newslettersRoutes);
router.use('/invitations', invitationsRoutes);
router.use('/registrations', registrationsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/audit', auditRoutes);
router.use('/upload', uploadRoutes);
router.use('/trash', trashRoutes);
router.use('/payments', paymentsRoutes);
router.use('/attendance', attendanceRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
