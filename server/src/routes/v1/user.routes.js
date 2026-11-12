import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { addressSchema, addressUpdateSchema } from '../../validators/address.schema.js';
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../../controllers/user.controller.js';

const router = Router();
router.use(authenticate);

router.get('/me/addresses', listAddresses);
router.post('/me/addresses', validateBody(addressSchema), createAddress);
router.patch('/me/addresses/:id', validateBody(addressUpdateSchema), updateAddress);
router.delete('/me/addresses/:id', deleteAddress);

export default router;