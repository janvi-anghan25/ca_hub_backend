import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAdminSchema, updateOfficeSchema } from '../validators/superAdminValidator.js';
import {
  getGlobalStats,
  getAllOffices,
  getOfficeById,
  updateOffice,
  toggleOfficeStatus,
  getAllAdmins,
  createAdmin,
  toggleAdminStatus,
} from '../controllers/superAdminController.js';

const router = Router();

// All super-admin routes require authentication + superadmin role
router.use(protect, restrictTo('superadmin'));

// ─── Global Stats ─────────────────────────────────────────────────────────────
router.get('/stats', getGlobalStats);

// ─── Offices (CA Firms) ───────────────────────────────────────────────────────
router.get('/offices', getAllOffices);
router.get('/offices/:id', getOfficeById);
router.put('/offices/:id', validate(updateOfficeSchema), updateOffice);
router.patch('/offices/:id/toggle-status', toggleOfficeStatus);

// ─── Admins ───────────────────────────────────────────────────────────────────
router.get('/admins', getAllAdmins);
router.post('/admins', validate(createAdminSchema), createAdmin);
router.patch('/admins/:id/toggle-status', toggleAdminStatus);

export default router;
