import { Router } from 'express';
import {
  createTask, getTasks, getTaskById, updateTask,
  addComment, getTodaysTasks, getOverdueTasks, deleteTask,
} from '../controllers/taskController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// All roles can view tasks and add comments
router.get('/today', getTodaysTasks);
router.get('/overdue', getOverdueTasks);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/:id/comments', addComment);

// Only admin/superadmin can create, update, delete tasks
router.post('/', restrictTo('admin', 'superadmin'), createTask);
router.put('/:id', restrictTo('admin', 'superadmin'), updateTask);
router.delete('/:id', restrictTo('admin', 'superadmin'), deleteTask);

export default router;
