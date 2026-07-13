import Client from '../models/Client.js';
import GSTReturn from '../models/GSTReturn.js';
import ITRReturn from '../models/ITRReturn.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Task from '../models/Task.js';

const dashboardService = {
  async getHomeDashboard(officeId) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalClients,
      activeClients,
      pendingGST,
      pendingITR,
      pendingPayments,
      todaysTasks,
      monthlyRevenue,
      monthlyCollection,
    ] = await Promise.all([
      Client.countDocuments({ office: officeId }),
      Client.countDocuments({ office: officeId, status: 'Active' }),
      GSTReturn.countDocuments({
        office: officeId,
        status: { $in: ['Pending', 'Data Received', 'In Progress'] },
      }),
      ITRReturn.countDocuments({
        office: officeId,
        status: { $in: ['Pending', 'Data Received', 'In Progress'] },
      }),
      Invoice.aggregate([
        {
          $match: {
            office: officeId,
            paymentStatus: { $in: ['Pending', 'Partially Paid'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$balanceDue' }, count: { $sum: 1 } } },
      ]),
      Task.countDocuments({
        office: officeId,
        dueDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'Cancelled' },
      }),
      Invoice.aggregate([
        {
          $match: {
            office: officeId,
            invoiceDate: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            office: officeId,
            paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const gstDueToday = await GSTReturn.countDocuments({
      office: officeId,
      dueDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Filed', 'Late Filed'] },
    });

    const itrDueToday = await ITRReturn.countDocuments({
      office: officeId,
      dueDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Filed', 'Late Filed'] },
    });

    return {
      clients: { total: totalClients, active: activeClients },
      gst: { pending: pendingGST, dueToday: gstDueToday },
      itr: { pending: pendingITR, dueToday: itrDueToday },
      payments: {
        pendingAmount: pendingPayments[0]?.total || 0,
        pendingCount: pendingPayments[0]?.count || 0,
      },
      tasks: { todaysCount: todaysTasks },
      revenue: {
        monthlyInvoiced: monthlyRevenue[0]?.total || 0,
        monthlyCollected: monthlyCollection[0]?.total || 0,
      },
    };
  },

  async getMonthlyChartData(officeId, year) {
    const [gstStats, itrStats, revenueData] = await Promise.all([
      GSTReturn.aggregate([
        { $match: { office: officeId, 'period.year': year } },
        { $group: { _id: { month: '$period.month', status: '$status' }, count: { $sum: 1 } } },
        { $sort: { '_id.month': 1 } },
      ]),
      ITRReturn.aggregate([
        {
          $match: {
            office: officeId,
            filedDate: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`),
            },
          },
        },
        {
          $group: {
            _id: { $month: '$filedDate' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
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
            amount: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return { gstStats, itrStats, revenueData };
  },
};

export default dashboardService;
