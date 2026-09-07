import { Router } from 'express';
import * as tripController from '../controllers/tripController';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { createTripSchema, updateTripSchema, paginationSchema } from '../validators/schemas';

const router = Router();
router.post('/', requireAuth, validateBody(createTripSchema), tripController.createTrip);
router.get('/', requireAuth, validateQuery(paginationSchema), tripController.listTrips);
router.get('/:id', requireAuth, tripController.getTrip);
router.put('/:id', requireAuth, validateBody(updateTripSchema), tripController.updateTrip);
router.delete('/:id', requireAuth, tripController.deleteTrip);
export default router;
