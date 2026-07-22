import taskRepository from '../repositories/taskRepository.js';
import Notification from '../models/Notification.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const taskService = {
  async createTask(data, userId, officeId) {
    const task = await taskRepository.create({ ...data, assignedBy: userId, office: officeId });

    if (data.assignedTo) {
      await Notification.create({
        recipient: data.assignedTo,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${data.title}`,
        data: { taskId: task._id },
      });
    }

    logger.info(`Task created: ${task.title}`);
    return task;
  },

  async getTasks(officeId, filters, page, limit) {
    const { search, ...restFilters } = filters;
    const filter = { office: officeId, ...restFilters };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    return taskRepository.find(filter, {
      page,
      limit,
      sort: { dueDate: 1, priority: -1 },
      populate: [
        { path: 'client', select: 'clientName firmName' },
        { path: 'assignedTo', select: 'name' },
        { path: 'assignedBy', select: 'name' },
      ],
    });
  },

  async getTaskById(id) {
    const task = await taskRepository.findById(id, {
      populate: [
        { path: 'client', select: 'clientName firmName' },
        { path: 'assignedTo', select: 'name mobile email' },
        { path: 'assignedBy', select: 'name' },
        { path: 'comments.user', select: 'name avatar' },
      ],
    });
    if (!task) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    return task;
  },

  async updateTask(id, data) {
    if (data.status === 'Done' && !data.completedAt) {
      data.completedAt = new Date();
    }
    const task = await taskRepository.updateById(id, data);
    if (!task) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    return task;
  },

  async addComment(taskId, userId, text) {
    const task = await taskRepository.updateById(
      taskId,
      { $push: { comments: { user: userId, text } } },
      { new: true, runValidators: false }
    );
    if (!task) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    return taskService.getTaskById(taskId);
  },

  async toggleSubtask(taskId, subtaskId) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');

    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) throw new AppError('Subtask not found', 404, 'SUBTASK_NOT_FOUND');

    subtask.isCompleted = !subtask.isCompleted;
    subtask.completedAt = subtask.isCompleted ? new Date() : undefined;

    await task.save();
    return taskService.getTaskById(taskId);
  },

  async getTodaysTasks(officeId) {
    return taskRepository.getTodaysTasks(officeId);
  },

  async getOverdueTasks(officeId) {
    return taskRepository.getOverdueTasks(officeId);
  },

  async deleteTask(id) {
    const task = await taskRepository.deleteById(id);
    if (!task) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  },
};

export default taskService;
