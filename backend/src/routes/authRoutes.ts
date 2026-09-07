import { Router } from 'express';
import * as authController from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/schemas';

const router = Router();
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/profile', requireAuth, authController.getOrSyncProfile);
router.put('/profile', requireAuth, validateBody(updateProfileSchema), authController.updateProfile);
export default router;
