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

  async getPaymentsByOffice(officeId, filters = {}, page = 1, limit = 15) {
    return this.find(
      { office: officeId, ...filters },
      {
        page,
        limit,
        sort: { paymentDate: -1, createdAt: -1 },
        populate: [
          { path: 'client', select: 'clientName firmName' },
          { path: 'invoice', select: 'invoiceNumber totalAmount' },
        ],
      }
    );
  }

  /**
   * Next sequential receipt number scoped to an office, e.g. RCP-0001.
   * Only considers documents where receiptNumber is a real string so legacy
   * null rows are ignored.
   */
  async getNextReceiptNumber(officeId, prefix = 'RCP') {
    const latest = await Payment.findOne({
      office: officeId,
      receiptNumber: { $type: 'string' },
    })
      .sort({ createdAt: -1 })
      .select('receiptNumber')
      .lean();

    if (!latest?.receiptNumber) return `${prefix}-0001`;

    const num = parseInt(latest.receiptNumber.split('-').pop(), 10) || 0;
    return `${prefix}-${String(num + 1).padStart(4, '0')}`;
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
