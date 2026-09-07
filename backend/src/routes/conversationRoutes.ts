import { Router } from 'express';
import * as conversationController from '../controllers/conversationController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { sendMessageSchema } from '../validators/schemas';

const router = Router();
router.get('/', requireAuth, conversationController.listMyConversations);
router.get('/:id/messages', requireAuth, conversationController.getMessages);
router.post('/:id/messages', requireAuth, validateBody(sendMessageSchema), conversationController.sendMessage);
export default router;
