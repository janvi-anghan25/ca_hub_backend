import { Router } from 'express';
import {
  createReturn, getReturns, getReturnById, updateReturn,
  deleteReturn, getPendingReturns, getOverdueReturns, getMonthlyStats,
} from '../controllers/gstReturnController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createGSTReturnSchema, updateGSTReturnSchema } from '../validators/gstReturnValidator.js';

const router = Router();

router.use(protect);

router.get('/pending', getPendingReturns);
router.get('/overdue', getOverdueReturns);
router.get('/stats/monthly', getMonthlyStats);

router.route('/')
  .get(getReturns)
  .post(validate(createGSTReturnSchema), createReturn);

router.route('/:id')
  .get(getReturnById)
  .put(validate(updateGSTReturnSchema), updateReturn)
  .delete(deleteReturn);

export default router;
