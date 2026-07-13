import Task from '../models/Task.js';
import BaseRepository from './baseRepository.js';

class TaskRepository extends BaseRepository {
  constructor() {
    super(Task);
  }

  async getTasksByEmployee(employeeId, filters = {}) {
    return Task.find({ assignedTo: employeeId, ...filters })
      .populate('client', 'clientName firmName')
      .populate('assignedBy', 'name')
      .sort({ dueDate: 1, priority: -1 })
      .lean();
  }

  async getTodaysTasks(officeId) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return Task.find({
      office: officeId,
      dueDate: { $gte: start, $lte: end },
      status: { $ne: 'Cancelled' },
    })
      .populate('client', 'clientName')
      .populate('assignedTo', 'name')
      .lean();
  }

  async getOverdueTasks(officeId) {
    return Task.find({
      office: officeId,
      status: { $nin: ['Done', 'Cancelled'] },
      dueDate: { $lt: new Date() },
    })
      .populate('client', 'clientName firmName')
      .populate('assignedTo', 'name')
      .lean();
  }
}

export default new TaskRepository();
