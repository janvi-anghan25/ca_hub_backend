import documentRepository from '../repositories/documentRepository.js';
import AppError from '../utils/AppError.js';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

const documentService = {
  async uploadDocument(clientId, data, file, userId, officeId) {
    const fileUrl = `/uploads/${file.filename}`;
    const document = await documentRepository.create({
      client: clientId,
      ...data,
      fileUrl,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy: userId,
      office: officeId,
    });
    logger.info(`Document uploaded for client ${clientId}: ${file.originalname}`);
    return document;
  },

  async getDocuments(clientId, query, category) {
    return documentRepository.searchDocuments(clientId, query, category);
  },

  async getDocumentById(id) {
    const doc = await documentRepository.findById(id, {
      populate: { path: 'uploadedBy', select: 'name' },
    });
    if (!doc) throw new AppError('Document not found', 404, 'DOC_NOT_FOUND');
    return doc;
  },

  async updateDocumentVersion(id, file, userId, notes) {
    const doc = await documentRepository.findById(id, { lean: false });
    if (!doc) throw new AppError('Document not found', 404, 'DOC_NOT_FOUND');

    const oldVersion = {
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      uploadedBy: doc.uploadedBy,
      notes,
    };

    const updated = await documentRepository.updateById(id, {
      fileUrl: `/uploads/${file.filename}`,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      $push: { versions: oldVersion },
    });
    return updated;
  },

  async deleteDocument(id) {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new AppError('Document not found', 404, 'DOC_NOT_FOUND');

    const filePath = path.join(process.cwd(), doc.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await documentRepository.updateById(id, { isActive: false });
    logger.info(`Document deleted: ${id}`);
  },
};

export default documentService;
