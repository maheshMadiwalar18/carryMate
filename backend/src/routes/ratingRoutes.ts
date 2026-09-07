import { Router } from 'express';
import * as ratingController from '../controllers/ratingController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createRatingSchema } from '../validators/schemas';

const router = Router();
router.post('/', requireAuth, validateBody(createRatingSchema), ratingController.createRating);
export default router;
