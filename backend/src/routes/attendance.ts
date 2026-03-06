import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireTeacher } from '../middleware/authorize';
import { saveAttendance, getAttendance } from '../controllers/attendanceController';

const router = Router();

// All attendance routes require authentication
router.use(authenticate);

// POST / — Bulk upsert attendance (teacher or admin)
router.post('/', requireTeacher, saveAttendance);

// GET /?date=YYYY-MM-DD — Fetch attendance for a date (teacher or admin)
router.get('/', requireTeacher, getAttendance);

export default router;
