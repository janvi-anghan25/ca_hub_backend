import gstReturnRepository from '../repositories/gstReturnRepository.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const gstReturnService = {
  async createReturn(data, userId, officeId) {
    const existing = await gstReturnRepository.findOne({
      client: data.client,
      returnType: data.returnType,
      'period.year': data.period.year,
      'period.month': data.period.month,
      'period.quarter': data.period.quarter,
    });
    if (existing) throw new AppError('GST Return for this period already exists', 409, 'RETURN_EXISTS');

    const gstReturn = await gstReturnRepository.create({ ...data, createdBy: userId, office: officeId });
    logger.info(`GST Return created for client ${data.client}`);
    return gstReturn;
  },

  async getReturns(officeId, filters, page, limit) {
    const filter = { office: officeId, ...filters };
    return gstReturnRepository.find(filter, {
      page,
      limit,
      sort: { dueDate: 1 },
      populate: { path: 'client', select: 'clientName firmName gstNumber mobile' },
    });
  },

  async getReturnById(id) {
    const gstReturn = await gstReturnRepository.findById(id, {
      populate: [
        { path: 'client', select: 'clientName firmName gstNumber mobile email' },
        { path: 'assignedTo', select: 'name mobile' },
      ],
    });
    if (!gstReturn) throw new AppError('GST Return not found', 404, 'RETURN_NOT_FOUND');
    return gstReturn;
  },

  async updateReturn(id, data) {
    if (data.status === 'Filed' && !data.filedDate) {
      data.filedDate = new Date();
    }
    const gstReturn = await gstReturnRepository.updateById(id, data);
    if (!gstReturn) throw new AppError('GST Return not found', 404, 'RETURN_NOT_FOUND');
    return gstReturn;
  },

  async deleteReturn(id) {
    const gstReturn = await gstReturnRepository.deleteById(id);
    if (!gstReturn) throw new AppError('GST Return not found', 404, 'RETURN_NOT_FOUND');
  },

  async getPendingReturns(officeId, days) {
    return gstReturnRepository.getPendingReturns(officeId, days);
  },

  async getOverdueReturns(officeId) {
    return gstReturnRepository.getOverdueReturns(officeId);
  },

  async getMonthlyStats(officeId, year) {
    return gstReturnRepository.getMonthlyStats(officeId, year);
  },

  async markLateFiled(id) {
    const gstReturn = await gstReturnRepository.findById(id, { lean: false });
    if (!gstReturn) throw new AppError('GST Return not found', 404, 'RETURN_NOT_FOUND');

    if (new Date(gstReturn.dueDate) < new Date() && gstReturn.status !== 'Filed') {
      await gstReturnRepository.updateById(id, { status: 'Late Filed', filedDate: new Date() });
    }
  },
};

export default gstReturnService;
