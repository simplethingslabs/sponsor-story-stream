import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireTeacher } from '../middleware/authorize';
import { getMoments, createMoment, deleteMoment } from '../controllers/momentsController';

const router = Router();

router.use(authenticate);

// GET / — List all moments (teacher or admin)
router.get('/', requireTeacher, getMoments);

// POST / — Create a new moment (teacher or admin)
router.post('/', requireTeacher, createMoment);

// DELETE /:id — Delete a moment (teacher or admin)
router.delete('/:id', requireTeacher, deleteMoment);

export default router;
