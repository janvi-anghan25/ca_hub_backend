import { Router } from 'express';
import {
  createTask, getTasks, getTaskById, updateTask,
  addComment, getTodaysTasks, getOverdueTasks, deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/today', getTodaysTasks);
router.get('/overdue', getOverdueTasks);

router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);
router.post('/:id/comments', addComment);

export default router;
