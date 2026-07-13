import ITRReturn from '../models/ITRReturn.js';
import BaseRepository from './baseRepository.js';

class ITRReturnRepository extends BaseRepository {
  constructor() {
    super(ITRReturn);
  }

  async getPendingReturns(officeId, days = 7) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    return ITRReturn.find({
      office: officeId,
      status: { $in: ['Pending', 'Data Received', 'In Progress'] },
      dueDate: { $lte: targetDate },
    })
      .populate('client', 'clientName firmName mobile email panNumber')
      .sort({ dueDate: 1 })
      .lean();
  }

  async getOverdueReturns(officeId) {
    return ITRReturn.find({
      office: officeId,
      status: { $nin: ['Filed', 'Late Filed', 'Revised'] },
      dueDate: { $lt: new Date() },
    })
      .populate('client', 'clientName firmName mobile email panNumber')
      .sort({ dueDate: 1 })
      .lean();
  }

  async getRefundPending(officeId) {
    return ITRReturn.find({
      office: officeId,
      refundStatus: 'Pending',
    })
      .populate('client', 'clientName firmName mobile email panNumber')
      .lean();
  }

  async findForReminder(daysBeforeDue) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeDue);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    return ITRReturn.find({
      status: { $in: ['Pending', 'Data Received', 'In Progress'] },
      dueDate: { $gte: startOfDay, $lte: endOfDay },
    }).populate('client', 'clientName firmName mobile email');
  }
}

export default new ITRReturnRepository();
