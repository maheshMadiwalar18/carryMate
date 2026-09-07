import { Router } from 'express';
import * as matchController from '../controllers/matchController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.get('/trip/:tripId', requireAuth, matchController.getMatchesForTrip);
router.get('/request/:requestId', requireAuth, matchController.getMatchesForRequest);
export default router;
