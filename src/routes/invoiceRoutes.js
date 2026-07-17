import { Router } from 'express';
import {
  createInvoice, getInvoices, getInvoiceById, updateInvoice,
  recordPayment, getPayments, getRevenueStats, getMonthlyRevenue, getOverdueInvoices,
} from '../controllers/invoiceController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createInvoiceSchema, recordPaymentSchema } from '../validators/invoiceValidator.js';

const router = Router();

router.use(protect);

// Employees can view invoices but cannot create/modify
router.get('/overdue', restrictTo('admin', 'employee', 'superadmin'), getOverdueInvoices);
router.get('/payments', restrictTo('admin', 'employee', 'superadmin'), getPayments);
router.get('/stats/revenue', restrictTo('admin', 'employee', 'superadmin'), getRevenueStats);
router.get('/stats/monthly', restrictTo('admin', 'employee', 'superadmin'), getMonthlyRevenue);

router.route('/')
  .get(restrictTo('admin', 'employee', 'superadmin'), getInvoices)
  .post(restrictTo('admin', 'employee', 'superadmin'), validate(createInvoiceSchema), createInvoice);

router.route('/:id')
  .get(restrictTo('admin', 'employee', 'superadmin'), getInvoiceById)
  .put(restrictTo('admin', 'employee', 'superadmin'), updateInvoice);

router.post('/:id/payments', restrictTo('admin', 'employee', 'superadmin'), validate(recordPaymentSchema), recordPayment);

export default router;
