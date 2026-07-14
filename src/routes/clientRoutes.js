import { Router } from 'express';
import {
  createClient, getClients, getClientById, updateClient,
  deleteClient, uploadClientPhoto, getClientStats,
} from '../controllers/clientController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadPhoto } from '../middleware/upload.js';
import { createClientSchema, updateClientSchema } from '../validators/clientValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', getClientStats);
router.route('/')
  .get(getClients)
  .post(restrictTo('admin', 'superadmin'), validate(createClientSchema), createClient);

router.route('/:id')
  .get(getClientById)
  .put(restrictTo('admin', 'superadmin'), validate(updateClientSchema), updateClient)
  .delete(restrictTo('admin', 'superadmin'), deleteClient);

router.post('/:id/photo', restrictTo('admin', 'superadmin'), uploadPhoto, uploadClientPhoto);

export default router;
