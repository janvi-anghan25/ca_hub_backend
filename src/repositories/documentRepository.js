import Document from '../models/Document.js';
import BaseRepository from './baseRepository.js';

class DocumentRepository extends BaseRepository {
  constructor() {
    super(Document);
  }

  async searchDocuments(clientId, query, category) {
    const filter = { client: clientId, isActive: true };
    if (category) filter.category = category;
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ];
    }
    return Document.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
  }
}

export default new DocumentRepository();
