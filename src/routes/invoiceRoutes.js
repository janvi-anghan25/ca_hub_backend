import { Router } from 'express';
import {
  createInvoice, getInvoices, getInvoiceById, updateInvoice,
  recordPayment, getRevenueStats, getMonthlyRevenue, getOverdueInvoices,
} from '../controllers/invoiceController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createInvoiceSchema, recordPaymentSchema } from '../validators/invoiceValidator.js';

const router = Router();

router.use(protect);

router.get('/overdue', getOverdueInvoices);
router.get('/stats/revenue', getRevenueStats);
router.get('/stats/monthly', getMonthlyRevenue);

router.route('/').get(getInvoices).post(validate(createInvoiceSchema), createInvoice);
router.route('/:id').get(getInvoiceById).put(updateInvoice);
router.post('/:id/payments', validate(recordPaymentSchema), recordPayment);

export default router;
