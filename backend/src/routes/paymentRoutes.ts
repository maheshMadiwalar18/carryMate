import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createOrderSchema, verifyPaymentSchema } from '../validators/schemas';

const router = Router();
router.post('/create-order', requireAuth, validateBody(createOrderSchema), paymentController.createPaymentOrder);
router.post('/verify', requireAuth, validateBody(verifyPaymentSchema), paymentController.verifyPayment);
router.get('/demo-signature', requireAuth, paymentController.getDemoSignature);
router.get('/my-transactions', requireAuth, paymentController.getMyTransactions);
export default router;
