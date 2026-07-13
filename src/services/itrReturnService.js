import itrReturnRepository from '../repositories/itrReturnRepository.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const itrReturnService = {
  async createReturn(data, userId, officeId) {
    const existing = await itrReturnRepository.findOne({
      client: data.client,
      formType: data.formType,
      assessmentYear: data.assessmentYear,
    });
    if (existing) throw new AppError('ITR for this assessment year already exists', 409, 'ITR_EXISTS');

    const itrReturn = await itrReturnRepository.create({ ...data, createdBy: userId, office: officeId });
    logger.info(`ITR created for client ${data.client}`);
    return itrReturn;
  },

  async getReturns(officeId, filters, page, limit) {
    const filter = { office: officeId, ...filters };
    return itrReturnRepository.find(filter, {
      page,
      limit,
      sort: { dueDate: 1 },
      populate: { path: 'client', select: 'clientName firmName panNumber mobile' },
    });
  },

  async getReturnById(id) {
    const itrReturn = await itrReturnRepository.findById(id, {
      populate: [
        { path: 'client', select: 'clientName firmName panNumber mobile email' },
        { path: 'assignedTo', select: 'name mobile' },
      ],
    });
    if (!itrReturn) throw new AppError('ITR not found', 404, 'ITR_NOT_FOUND');
    return itrReturn;
  },

  async updateReturn(id, data) {
    if (data.status === 'Filed' && !data.filedDate) {
      data.filedDate = new Date();
    }
    const itrReturn = await itrReturnRepository.updateById(id, data);
    if (!itrReturn) throw new AppError('ITR not found', 404, 'ITR_NOT_FOUND');
    return itrReturn;
  },

  async deleteReturn(id) {
    const itrReturn = await itrReturnRepository.deleteById(id);
    if (!itrReturn) throw new AppError('ITR not found', 404, 'ITR_NOT_FOUND');
  },

  async getPendingReturns(officeId, days) {
    return itrReturnRepository.getPendingReturns(officeId, days);
  },

  async getOverdueReturns(officeId) {
    return itrReturnRepository.getOverdueReturns(officeId);
  },

  async getRefundPending(officeId) {
    return itrReturnRepository.getRefundPending(officeId);
  },
};

export default itrReturnService;
