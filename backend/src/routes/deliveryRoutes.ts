import { Router } from 'express';
import * as deliveryController from '../controllers/deliveryController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { otpVerifySchema } from '../validators/schemas';

const router = Router();
router.get('/', requireAuth, deliveryController.listMyDeliveries);
router.get('/:id', requireAuth, deliveryController.getDelivery);
router.post('/:id/accept', requireAuth, deliveryController.acceptDelivery);
router.post('/:id/cancel', requireAuth, deliveryController.cancelDelivery);
router.post('/:id/pickup/generate-otp', requireAuth, deliveryController.generatePickupOtp);
router.post('/:id/pickup/verify', requireAuth, validateBody(otpVerifySchema), deliveryController.verifyPickupOtp);
router.post('/:id/delivery/generate-otp', requireAuth, deliveryController.generateDeliveryOtp);
router.post('/:id/delivery/verify', requireAuth, validateBody(otpVerifySchema), deliveryController.verifyDeliveryOtp);
router.post('/:id/confirm', requireAuth, deliveryController.confirmDelivery);
export default router;
