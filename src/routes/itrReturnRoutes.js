import { Router } from 'express';
import {
  createReturn, getReturns, getReturnById, updateReturn,
  deleteReturn, getPendingReturns, getOverdueReturns, getRefundPending,
} from '../controllers/itrReturnController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/pending', getPendingReturns);
router.get('/overdue', getOverdueReturns);
router.get('/refund-pending', getRefundPending);

router.route('/').get(getReturns).post(createReturn);
router.route('/:id').get(getReturnById).put(updateReturn).delete(deleteReturn);

export default router;
