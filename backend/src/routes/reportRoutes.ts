import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createReportSchema } from '../validators/schemas';

const router = Router();
router.post('/', requireAuth, validateBody(createReportSchema), reportController.createReport);
export default router;
