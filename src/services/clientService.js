import clientRepository from '../repositories/clientRepository.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const clientService = {
  async createClient(data, userId, officeId) {
    if (data.gstNumber) {
      const existing = await clientRepository.findByGST(data.gstNumber, officeId);
      if (existing) throw new AppError('A client with this GST number already exists', 409, 'GST_EXISTS');
    }
    if (data.panNumber) {
      const existing = await clientRepository.findByPAN(data.panNumber, officeId);
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

  async updateClient(id, data, officeId) {
    if (data.gstNumber) {
      const existing = await clientRepository.findByGST(data.gstNumber, officeId, id);
      if (existing) throw new AppError('A client with this GST number already exists', 409, 'GST_EXISTS');
    }
    if (data.panNumber) {
      const existing = await clientRepository.findByPAN(data.panNumber, officeId, id);
      if (existing) throw new AppError('A client with this PAN number already exists', 409, 'PAN_EXISTS');
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

  /**
   * Find an existing client (by GST, then PAN, then mobile within the office) or
   * create a new one. Used by bulk imports. Returns { client, created }.
   */
  async findOrCreateForImport(data, userId, officeId) {
    let client = null;
    if (data.gstNumber) client = await clientRepository.findByGST(data.gstNumber, officeId);
    if (!client && data.panNumber) client = await clientRepository.findByPAN(data.panNumber, officeId);
    if (!client && data.mobile) client = await clientRepository.findOne({ office: officeId, mobile: data.mobile });
    if (client) return { client, created: false };

    if (!data.clientName || data.clientName.length < 2) {
      throw new AppError('Client not found and clientName is missing to create one', 400, 'CLIENT_NAME_REQUIRED');
    }
    if (!/^[6-9]\d{9}$/.test(data.mobile || '')) {
      throw new AppError('Client not found and a valid 10-digit mobile is required to create one', 400, 'CLIENT_MOBILE_REQUIRED');
    }

    const created = await clientRepository.create({
      clientName: data.clientName,
      mobile: data.mobile,
      gstNumber: data.gstNumber || undefined,
      panNumber: data.panNumber || undefined,
      businessType: data.businessType || 'Proprietorship',
      category: data.category?.length ? data.category : ['Other'],
      createdBy: userId,
      office: officeId,
    });
    logger.info(`Client auto-created via import: ${created.clientName}`);
    return { client: created, created: true };
  },
};

export default clientService;
