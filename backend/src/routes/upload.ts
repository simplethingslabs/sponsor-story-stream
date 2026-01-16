import { Router } from 'express';
import multer from 'multer';
import * as uploadController from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

router.use(authenticate);

router.post('/image', upload.single('file'), uploadController.uploadImage);
router.post('/document', upload.single('file'), uploadController.uploadDocument);
router.post('/video', upload.single('file'), uploadController.uploadVideo);
router.get('/signature', uploadController.getUploadSignature);
router.delete('/:public_id', uploadController.deleteFile);

export default router;
