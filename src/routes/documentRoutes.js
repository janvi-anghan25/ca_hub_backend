import { Router } from 'express';
import {
  uploadDocument, getDocuments, getDocumentById,
  updateDocumentVersion, deleteDocument,
} from '../controllers/documentController.js';
import { protect } from '../middleware/auth.js';
import { uploadDocument as uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(protect);

router.route('/client/:clientId')
  .get(getDocuments)
  .post(uploadMiddleware, uploadDocument);

router.route('/:id')
  .get(getDocumentById)
  .put(uploadMiddleware, updateDocumentVersion)
  .delete(deleteDocument);

export default router;
