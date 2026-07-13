import GSTReturn from '../models/GSTReturn.js';
import BaseRepository from './baseRepository.js';

class GSTReturnRepository extends BaseRepository {
  constructor() {
    super(GSTReturn);
  }

  async getPendingReturns(officeId, days = 7) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    return GSTReturn.find({
      office: officeId,
      status: { $in: ['Pending', 'Data Received', 'In Progress'] },
      dueDate: { $lte: targetDate },
    })
      .populate('client', 'clientName firmName mobile email gstNumber')
      .sort({ dueDate: 1 })
      .lean();
  }

  async getOverdueReturns(officeId) {
    return GSTReturn.find({
      office: officeId,
      status: { $nin: ['Filed', 'Late Filed'] },
      dueDate: { $lt: new Date() },
    })
      .populate('client', 'clientName firmName mobile email gstNumber')
      .sort({ dueDate: 1 })
      .lean();
  }

  async getMonthlyStats(officeId, year) {
    return GSTReturn.aggregate([
      {
        $match: {
          office: officeId,
          'period.year': year,
        },
      },
      {
        $group: {
          _id: { month: '$period.month', status: '$status' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);
  }

  async findForReminder(daysBeforeDue) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeDue);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    return GSTReturn.find({
      status: { $in: ['Pending', 'Data Received', 'In Progress'] },
      dueDate: { $gte: startOfDay, $lte: endOfDay },
    }).populate('client', 'clientName firmName mobile email');
  }
}

export default new GSTReturnRepository();
