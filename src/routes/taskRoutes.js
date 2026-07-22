import { Router } from 'express';
import {
  createTask, getTasks, getTaskById, updateTask,
  addComment, toggleSubtask, getTodaysTasks, getOverdueTasks, deleteTask,
} from '../controllers/taskController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// All roles can view tasks, toggle subtasks, and add comments
router.get('/today', getTodaysTasks);
router.get('/overdue', getOverdueTasks);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/:id/comments', addComment);
router.patch('/:id/subtasks/:subtaskId/toggle', toggleSubtask);

// Create, update, delete tasks
router.post('/', restrictTo('admin', 'employee', 'superadmin'), createTask);
router.put('/:id', restrictTo('admin', 'employee', 'superadmin'), updateTask);
router.delete('/:id', restrictTo('admin', 'employee', 'superadmin'), deleteTask);

export default router;
