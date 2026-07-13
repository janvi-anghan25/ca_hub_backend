import { Router } from 'express';
import {
  createClient, getClients, getClientById, updateClient,
  deleteClient, uploadClientPhoto, getClientStats,
} from '../controllers/clientController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadPhoto } from '../middleware/upload.js';
import { createClientSchema, updateClientSchema } from '../validators/clientValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', getClientStats);
router.route('/')
  .get(getClients)
  .post(validate(createClientSchema), createClient);

router.route('/:id')
  .get(getClientById)
  .put(validate(updateClientSchema), updateClient)
  .delete(deleteClient);

router.post('/:id/photo', uploadPhoto, uploadClientPhoto);

export default router;
