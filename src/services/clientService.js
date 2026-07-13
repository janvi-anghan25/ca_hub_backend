import clientRepository from '../repositories/clientRepository.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const clientService = {
  async createClient(data, userId, officeId) {
    if (data.gstNumber) {
      const existing = await clientRepository.findByGST(data.gstNumber);
      if (existing) throw new AppError('A client with this GST number already exists', 409, 'GST_EXISTS');
    }
    if (data.panNumber) {
      const existing = await clientRepository.findByPAN(data.panNumber);
      if (existing) throw new AppError('A client with this PAN number already exists', 409, 'PAN_EXISTS');
    }
    const client = await clientRepository.create({ ...data, createdBy: userId, office: officeId });
    logger.info(`Client created: ${client.clientName} by user ${userId}`);
    return client;
  },

  async getClients(officeId, query, filters, page, limit) {
    return clientRepository.searchClients(query, officeId, filters, page, limit);
  },

  async getClientById(id) {
    const client = await clientRepository.findById(id, {
      populate: { path: 'assignedEmployee', select: 'name mobile email' },
    });
    if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
    return client;
  },

  async updateClient(id, data) {
    if (data.gstNumber) {
      const existing = await clientRepository.findOne({ gstNumber: data.gstNumber.toUpperCase(), _id: { $ne: id } });
      if (existing) throw new AppError('A client with this GST number already exists', 409, 'GST_EXISTS');
    }
    const client = await clientRepository.updateById(id, data);
    if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
    return client;
  },

  async deleteClient(id) {
    const client = await clientRepository.deleteById(id);
    if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
    logger.info(`Client deleted: ${id}`);
  },

  async updateClientPhoto(id, photoPath) {
    const client = await clientRepository.updateById(id, { photo: photoPath });
    if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
    return client;
  },

  async getClientStats(officeId) {
    return clientRepository.getClientStats(officeId);
  },
};

export default clientService;
