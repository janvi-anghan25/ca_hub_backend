import Invoice from '../models/Invoice.js';
import BaseRepository from './baseRepository.js';

class InvoiceRepository extends BaseRepository {
  constructor() {
    super(Invoice);
  }

  async getNextInvoiceNumber(officeId, prefix = 'INV') {
    const latest = await Invoice.findOne({ office: officeId })
      .sort({ createdAt: -1 })
      .select('invoiceNumber')
      .lean();

    if (!latest) return `${prefix}-001`;

    const num = parseInt(latest.invoiceNumber.split('-').pop(), 10) || 0;
    return `${prefix}-${String(num + 1).padStart(3, '0')}`;
  }

  async getRevenueStats(officeId, startDate, endDate) {
    return Invoice.aggregate([
      {
        $match: {
          office: officeId,
          invoiceDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalPending: { $sum: '$balanceDue' },
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async getMonthlyRevenue(officeId, year) {
    return Invoice.aggregate([
      {
        $match: {
          office: officeId,
          invoiceDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$invoiceDate' },
          revenue: { $sum: '$totalAmount' },
          paid: { $sum: '$paidAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getOverdueInvoices(officeId) {
    return Invoice.find({
      office: officeId,
      paymentStatus: { $in: ['Pending', 'Partially Paid'] },
      dueDate: { $lt: new Date() },
    })
      .populate('client', 'clientName firmName mobile email')
      .sort({ dueDate: 1 })
      .lean();
  }
}

export default new InvoiceRepository();
