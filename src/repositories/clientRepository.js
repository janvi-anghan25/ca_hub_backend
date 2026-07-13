import Client from '../models/Client.js';
import BaseRepository from './baseRepository.js';

class ClientRepository extends BaseRepository {
  constructor() {
    super(Client);
  }

  async searchClients(query, officeId, filters = {}, page = 1, limit = 10) {
    const match = { office: officeId, ...filters };

    if (query) {
      match.$or = [
        { clientName: { $regex: query, $options: 'i' } },
        { firmName: { $regex: query, $options: 'i' } },
        { mobile: { $regex: query, $options: 'i' } },
        { gstNumber: { $regex: query, $options: 'i' } },
        { panNumber: { $regex: query, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Client.find(match)
        .populate('assignedEmployee', 'name mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Client.countDocuments(match),
    ]);
    return { data, total };
  }

  async findByGST(gstNumber) {
    return Client.findOne({ gstNumber: gstNumber.toUpperCase() }).lean();
  }

  async findByPAN(panNumber) {
    return Client.findOne({ panNumber: panNumber.toUpperCase() }).lean();
  }

  async getClientStats(officeId) {
    return Client.aggregate([
      { $match: { office: officeId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
  }
}

export default new ClientRepository();
