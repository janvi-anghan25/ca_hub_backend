import { Router } from 'express';
import {
  createReturn, getReturns, getReturnById, updateReturn,
  deleteReturn, getPendingReturns, getOverdueReturns, getRefundPending, importReturns,
} from '../controllers/itrReturnController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { uploadImport } from '../middleware/upload.js';

const router = Router();

router.use(protect);

router.get('/pending', getPendingReturns);
router.get('/overdue', getOverdueReturns);
router.get('/refund-pending', getRefundPending);
router.post('/import', restrictTo('admin', 'employee', 'superadmin'), uploadImport, importReturns);

router.route('/').get(getReturns).post(restrictTo('admin', 'employee', 'superadmin'), createReturn);
router.route('/:id')
  .get(getReturnById)
  .put(restrictTo('admin', 'employee', 'superadmin'), updateReturn)
  .delete(restrictTo('admin', 'employee', 'superadmin'), deleteReturn);

export default router;
