import { Router } from 'express';
import multer from 'multer';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new AppError('Only JPEG, PNG, or WEBP images are allowed', 415, 'UNSUPPORTED_MEDIA_TYPE') as any);
    }
    cb(null, true);
  },
});

const router = Router();

router.post(
  '/image',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.file) throw AppError.validation('No file uploaded');

    if (env.FIREBASE_STORAGE_BUCKET) {
      const { getFirebaseAdmin } = await import('../config/firebase');
      const admin = getFirebaseAdmin();
      if (admin) {
        const bucket = admin.storage().bucket();
        const filename = `uploads/${req.user!._id}/${Date.now()}-${req.file.originalname}`;
        const fileRef = bucket.file(filename);
        await fileRef.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } });
        await fileRef.makePublic();
        return res.json({ success: true, data: { url: `https://storage.googleapis.com/${bucket.name}/${filename}` } });
      }
    }

    const base64 = req.file.buffer.toString('base64');
    res.json({ success: true, data: { url: `data:${req.file.mimetype};base64,${base64}`, demo: true } });
  })
);

export default router;
