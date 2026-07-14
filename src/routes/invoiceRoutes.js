import { Router } from 'express';
import {
  createInvoice, getInvoices, getInvoiceById, updateInvoice,
  recordPayment, getRevenueStats, getMonthlyRevenue, getOverdueInvoices,
} from '../controllers/invoiceController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createInvoiceSchema, recordPaymentSchema } from '../validators/invoiceValidator.js';

const router = Router();

router.use(protect);

// Employees can view invoices but cannot create/modify
router.get('/overdue', restrictTo('admin', 'superadmin'), getOverdueInvoices);
router.get('/stats/revenue', restrictTo('admin', 'superadmin'), getRevenueStats);
router.get('/stats/monthly', restrictTo('admin', 'superadmin'), getMonthlyRevenue);

router.route('/')
  .get(restrictTo('admin', 'superadmin'), getInvoices)
  .post(restrictTo('admin', 'superadmin'), validate(createInvoiceSchema), createInvoice);

router.route('/:id')
  .get(restrictTo('admin', 'superadmin'), getInvoiceById)
  .put(restrictTo('admin', 'superadmin'), updateInvoice);

router.post('/:id/payments', restrictTo('admin', 'superadmin'), validate(recordPaymentSchema), recordPayment);

export default router;
