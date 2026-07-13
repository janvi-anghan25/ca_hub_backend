import { Router } from 'express';
import {
  createEmployee, getEmployees, getEmployeeById, updateEmployee,
  assignClient, markAttendance, applyLeave, deleteEmployee,
} from '../controllers/employeeController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/').get(getEmployees).post(restrictTo('admin', 'superadmin'), createEmployee);
router.route('/:id').get(getEmployeeById).put(updateEmployee).delete(restrictTo('admin', 'superadmin'), deleteEmployee);
router.post('/:id/assign-client', restrictTo('admin', 'superadmin'), assignClient);
router.post('/:id/attendance', markAttendance);
router.post('/:id/leave', applyLeave);

export default router;
