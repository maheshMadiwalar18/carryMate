import { Router } from 'express';
import * as verificationController from '../controllers/verificationController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createVerificationSchema } from '../validators/schemas';

const router = Router();
router.post('/', requireAuth, validateBody(createVerificationSchema), verificationController.submitVerification);
router.get('/status', requireAuth, verificationController.getMyVerificationStatus);
export default router;
