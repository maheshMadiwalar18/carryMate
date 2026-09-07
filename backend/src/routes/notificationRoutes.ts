import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.get('/', requireAuth, notificationController.listMyNotifications);
router.post('/:id/read', requireAuth, notificationController.markNotificationRead);
export default router;
