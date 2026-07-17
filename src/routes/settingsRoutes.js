import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, updateOfficeSchema } from '../validators/settingsValidator.js';
import { updateProfile, getMyOffice, updateMyOffice } from '../controllers/settingsController.js';

const router = Router();

router.use(protect);

// Profile update — all authenticated users
router.put('/profile', validate(updateProfileSchema), updateProfile);

// Office settings — admin only (employees don't own offices)
router.get('/office', restrictTo('admin'), getMyOffice);
router.put('/office', restrictTo('admin'), validate(updateOfficeSchema), updateMyOffice);

export default router;
