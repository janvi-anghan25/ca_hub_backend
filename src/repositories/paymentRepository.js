import Payment from '../models/Payment.js';
import BaseRepository from './baseRepository.js';

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  async getPaymentsByClient(clientId, page = 1, limit = 10) {
    return this.find({ client: clientId }, {
      page,
      limit,
      sort: { paymentDate: -1 },
      populate: 'invoice',
    });
  }

  async getMonthlyCollection(officeId, year) {
    return Payment.aggregate([
      {
        $match: {
          office: officeId,
          paymentDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getTotalCollected(officeId, startDate, endDate) {
    const result = await Payment.aggregate([
      {
        $match: {
          office: officeId,
          paymentDate: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }
}

export default new PaymentRepository();
