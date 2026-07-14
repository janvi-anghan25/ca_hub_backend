import { Router } from 'express';
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  assignClient,
  markAttendance,
  applyLeave,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employeeValidator.js';

const router = Router();

router.use(protect);

// Employee management — Admin / Super Admin only (not employee role)
router
  .route('/')
  .get(restrictTo('admin', 'superadmin'), getEmployees)
  .post(restrictTo('admin', 'superadmin'), validate(createEmployeeSchema), createEmployee);

router
  .route('/:id')
  .get(restrictTo('admin', 'superadmin'), getEmployeeById)
  .put(restrictTo('admin', 'superadmin'), validate(updateEmployeeSchema), updateEmployee)
  .delete(restrictTo('admin', 'superadmin'), deleteEmployee);

router.post('/:id/assign-client', restrictTo('admin', 'superadmin'), assignClient);

// Attendance / leave — office users including employees
router.post(
  '/:id/attendance',
  restrictTo('admin', 'employee', 'superadmin'),
  markAttendance
);
router.post(
  '/:id/leave',
  restrictTo('admin', 'employee', 'superadmin'),
  applyLeave
);

export default router;
