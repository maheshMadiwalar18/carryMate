import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/analytics', adminController.getAnalytics);
router.get('/users', adminController.listUsers);
router.post('/users/:id/suspend', adminController.suspendUser);
router.get('/trips', adminController.listAllTrips);
router.get('/requests', adminController.listAllRequests);
router.get('/transactions', adminController.listAllTransactions);
router.get('/verifications', adminController.listVerificationRequests);
router.post('/verifications/:id/review', adminController.reviewVerification);
router.get('/reports', adminController.listReports);
router.post('/reports/:id/resolve', adminController.resolveReport);
router.get('/settings', adminController.getPlatformSettings);
router.put('/settings', adminController.updatePlatformSettings);
export default router;
