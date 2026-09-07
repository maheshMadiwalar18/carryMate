import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.get('/:id', requireAuth, userController.getPublicProfile);
router.get('/:id/ratings', requireAuth, userController.getUserRatings);
export default router;
