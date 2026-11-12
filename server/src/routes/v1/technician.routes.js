import { Router } from 'express';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import {
  directoryQuerySchema,
  technicianProfileSchema,
} from '../../validators/technician.schema.js';
import {
  listTechnicians,
  getPublicTechnician,
  listTechnicianReviews,
  getMyTechnicianProfile,
  updateMyTechnicianProfile,
  getFilterMeta,
} from '../../controllers/technician.controller.js';

const router = Router();

router.get('/meta', getFilterMeta);
router.get('/', optionalAuth, validateQuery(directoryQuerySchema), listTechnicians);

router.get(
  '/me/profile',
  authenticate,
  authorize('technician'),
  getMyTechnicianProfile
);
router.patch(
  '/me/profile',
  authenticate,
  authorize('technician'),
  validateBody(technicianProfileSchema),
  updateMyTechnicianProfile
);

router.get('/:id/reviews', listTechnicianReviews);
router.get('/:id', optionalAuth, getPublicTechnician);

export default router;