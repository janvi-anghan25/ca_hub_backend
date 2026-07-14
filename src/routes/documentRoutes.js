import { Router } from 'express';
import {
  uploadDocument, getDocuments, getDocumentById,
  updateDocumentVersion, deleteDocument,
} from '../controllers/documentController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { uploadDocument as uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(protect);

router.route('/client/:clientId')
  .get(getDocuments)
  .post(restrictTo('admin', 'superadmin'), uploadMiddleware, uploadDocument);

router.route('/:id')
  .get(getDocumentById)
  .put(restrictTo('admin', 'superadmin'), uploadMiddleware, updateDocumentVersion)
  .delete(restrictTo('admin', 'superadmin'), deleteDocument);

export default router;
