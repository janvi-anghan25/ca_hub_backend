import { Router } from 'express';
import {
  createReturn, getReturns, getReturnById, updateReturn,
  deleteReturn, getPendingReturns, getOverdueReturns, getRefundPending,
} from '../controllers/itrReturnController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/pending', getPendingReturns);
router.get('/overdue', getOverdueReturns);
router.get('/refund-pending', getRefundPending);

router.route('/').get(getReturns).post(restrictTo('admin', 'superadmin'), createReturn);
router.route('/:id')
  .get(getReturnById)
  .put(restrictTo('admin', 'superadmin'), updateReturn)
  .delete(restrictTo('admin', 'superadmin'), deleteReturn);

export default router;
