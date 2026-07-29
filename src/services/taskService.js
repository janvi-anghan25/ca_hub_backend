import taskRepository from '../repositories/taskRepository.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Notification from '../models/Notification.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { emitNewComment } from '../socket/socketServer.js';

const taskService = {
  async createTask(data, userId, officeId) {
    const task = await taskRepository.create({ ...data, assignedBy: userId, office: officeId });

    if (data.assignedTo) {
      let recipientUserId = data.assignedTo;
      const employee = await Employee.findById(data.assignedTo);
      if (employee && employee.user) {
        recipientUserId = employee.user;
      }

      await Notification.create({
        recipient: recipientUserId,
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
    const existingTask = await taskRepository.findById(id);
    const task = await taskRepository.updateById(id, data);
    if (!task) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');

    // Notify assigned user if assignedTo changed
    if (data.assignedTo && existingTask && String(existingTask.assignedTo?._id || existingTask.assignedTo) !== String(data.assignedTo)) {
      let recipientUserId = data.assignedTo;
      const employee = await Employee.findById(data.assignedTo);
      if (employee && employee.user) {
        recipientUserId = employee.user;
      }

      await Notification.create({
        recipient: recipientUserId,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `You have been assigned a task: ${task.title}`,
        data: { taskId: task._id },
      });
    }

    // Notify Admins, Task Assigner & Assigned Employee when task status changes
    if (data.status && existingTask && existingTask.status !== data.status) {
      const recipientUserIds = new Set();

      // Add task creator / assigner
      const assignedById = existingTask.assignedBy?._id || existingTask.assignedBy;
      if (assignedById) {
        recipientUserIds.add(String(assignedById));
      }

      // Add assigned employee's linked User ID
      const assignedToId = task.assignedTo?._id || task.assignedTo || existingTask.assignedTo?._id || existingTask.assignedTo;
      if (assignedToId) {
        const assignedEmployee = await Employee.findById(assignedToId).lean();
        if (assignedEmployee?.user) {
          recipientUserIds.add(String(assignedEmployee.user));
        } else {
          recipientUserIds.add(String(assignedToId));
        }
      }

      // Add office admins & superadmins
      const officeId = task.office?._id || task.office || existingTask.office?._id || existingTask.office;
      let admins = [];
      if (officeId) {
        admins = await User.find({
          office: officeId,
          role: { $in: ['admin', 'superadmin'] },
          isActive: true,
        }).select('_id').lean();
      }

      // Fallback: If no admins found for specific office, fetch all active admin/superadmin users
      if (admins.length === 0) {
        admins = await User.find({
          role: { $in: ['admin', 'superadmin'] },
          isActive: true,
        }).select('_id').lean();
      }

      admins.forEach((admin) => recipientUserIds.add(String(admin._id)));

      const notifType = data.status === 'Done' ? 'TASK_COMPLETED' : 'SYSTEM';
      const notificationsToCreate = Array.from(recipientUserIds).map((recipientId) => ({
        recipient: recipientId,
        type: notifType,
        title: `Task Status Updated: ${task.title}`,
        message: `Task "${task.title}" status changed from "${existingTask.status}" to "${data.status}"`,
        data: { taskId: task._id },
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      if (notificationsToCreate.length > 0) {
        await Notification.insertMany(notificationsToCreate);
        logger.info(`Status change notifications sent to ${notificationsToCreate.length} recipient(s) for task: ${task.title}`);
      }
    }

    return task;
  },

  async addComment(taskId, userId, text) {
    const taskDoc = await taskRepository.findById(taskId);
    if (!taskDoc) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');

    const updatedTask = await taskRepository.updateById(
      taskId,
      { $push: { comments: { user: userId, text } } },
      { new: true, runValidators: false }
    );

    // Send notifications to all task stakeholders except the commenter
    try {
      const commenter = await User.findById(userId).select('name').lean();
      const commenterName = commenter?.name || 'A team member';

      const recipientUserIds = new Set();

      // Add task assigner/creator if not commenter
      const assignedById = taskDoc.assignedBy?._id || taskDoc.assignedBy;
      if (assignedById && String(assignedById) !== String(userId)) {
        recipientUserIds.add(String(assignedById));
      }

      // Add assigned employee if not commenter
      const assignedToId = taskDoc.assignedTo?._id || taskDoc.assignedTo;
      if (assignedToId) {
        const assignedEmployee = await Employee.findById(assignedToId).lean();
        const employeeUserId = assignedEmployee?.user ? String(assignedEmployee.user) : String(assignedToId);
        if (employeeUserId && employeeUserId !== String(userId)) {
          recipientUserIds.add(employeeUserId);
        }
      }

      // Add office admins & superadmins (except commenter)
      const officeId = taskDoc.office?._id || taskDoc.office;
      let admins = [];
      if (officeId) {
        admins = await User.find({
          office: officeId,
          role: { $in: ['admin', 'superadmin'] },
          isActive: true,
        }).select('_id').lean();
      }

      if (admins.length === 0) {
        admins = await User.find({
          role: { $in: ['admin', 'superadmin'] },
          isActive: true,
        }).select('_id').lean();
      }

      admins.forEach((admin) => {
        if (String(admin._id) !== String(userId)) {
          recipientUserIds.add(String(admin._id));
        }
      });

      const truncatedText = text.length > 60 ? text.substring(0, 60) + '...' : text;
      const notificationsToCreate = Array.from(recipientUserIds).map((recipientId) => ({
        recipient: recipientId,
        type: 'SYSTEM',
        title: `New Comment on: ${taskDoc.title}`,
        message: `${commenterName}: "${truncatedText}"`,
        data: { taskId: taskDoc._id },
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      if (notificationsToCreate.length > 0) {
        await Notification.insertMany(notificationsToCreate);
        logger.info(`Comment notifications sent to ${notificationsToCreate.length} recipient(s) for task: ${taskDoc.title}`);
      }
    } catch (err) {
      logger.error('Failed to send comment notification:', err.message);
    }

    // Emit real-time socket event to all users in the task room
    const fullTask = await taskService.getTaskById(taskId);
    const latestComment = fullTask.comments?.[fullTask.comments.length - 1];
    if (latestComment) {
      emitNewComment(taskId, latestComment);
    }

    return fullTask;
  },

  async toggleSubtask(taskId, subtaskId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');

    const subtask = typeof task.subtasks.id === 'function'
      ? task.subtasks.id(subtaskId)
      : task.subtasks.find((s) => s._id.toString() === subtaskId.toString());

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
