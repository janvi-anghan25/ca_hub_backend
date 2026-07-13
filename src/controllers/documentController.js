import documentService from '../services/documentService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import AppError from '../utils/AppError.js';

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file provided', 400, 'NO_FILE');
  const document = await documentService.uploadDocument(
    req.params.clientId,
    req.body,
    req.file,
    req.user.id,
    req.user.office
  );
  successResponse(res, document, 'Document uploaded', 201);
});

export const getDocuments = asyncHandler(async (req, res) => {
  const { q, category } = req.query;
  const documents = await documentService.getDocuments(req.params.clientId, q, category);
  successResponse(res, documents, 'Documents fetched');
});

export const getDocumentById = asyncHandler(async (req, res) => {
  const document = await documentService.getDocumentById(req.params.id);
  successResponse(res, document, 'Document fetched');
});

export const updateDocumentVersion = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file provided', 400, 'NO_FILE');
  const document = await documentService.updateDocumentVersion(
    req.params.id,
    req.file,
    req.user.id,
    req.body.notes
  );
  successResponse(res, document, 'Document version updated');
});

export const deleteDocument = asyncHandler(async (req, res) => {
  await documentService.deleteDocument(req.params.id);
  successResponse(res, null, 'Document deleted');
});
