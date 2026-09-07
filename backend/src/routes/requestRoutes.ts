import { Router } from 'express';
import * as requestController from '../controllers/requestController';
import * as deliveryController from '../controllers/deliveryController';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { createRequestSchema, updateRequestSchema, paginationSchema, acceptRequestSchema } from '../validators/schemas';

const router = Router();
router.post('/', requireAuth, validateBody(createRequestSchema), requestController.createRequest);
router.get('/', requireAuth, validateQuery(paginationSchema), requestController.listRequests);
router.get('/:id', requireAuth, requestController.getRequest);
router.put('/:id', requireAuth, validateBody(updateRequestSchema), requestController.updateRequest);
router.delete('/:id', requireAuth, requestController.deleteRequest);
router.post('/:requestId/select-traveler', requireAuth, validateBody(acceptRequestSchema), deliveryController.selectTraveler);
export default router;
