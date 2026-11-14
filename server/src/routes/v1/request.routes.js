import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { imageUploader } from '../../middleware/upload.js';
import {
  createRequestSchema,
  updateRequestSchema,
  requestQuerySchema,
  requestStatusSchema,
  cancelRequestSchema,
  declineRequestSchema,
} from '../../validators/request.schema.js';
import {
  createRequest,
  listRequests,
  availableJobs,
  getRequest,
  updateRequest,
  acceptRequest,
  declineRequest,
  updateRequestStatus,
  cancelRequest,
  deleteRequest,
  getRequestLocation,
  startRequestLocation,
  updateRequestLocation,
  stopRequestLocation,
} from '../../controllers/request.controller.js';
import { locationCoordinatesSchema } from '../../validators/location.schema.js';

const router = Router();
router.use(authenticate);

router.get('/available', authorize('technician'), validateQuery(requestQuerySchema), availableJobs);
router.get('/', validateQuery(requestQuerySchema), listRequests);

router.post(
  '/',
  authorize('customer'),
  imageUploader('requests').array('photos', 5),
  validateBody(createRequestSchema),
  createRequest
);

router.patch('/:id/accept', authorize('technician'), acceptRequest);
router.patch(
  '/:id/decline',
  authorize('technician'),
  validateBody(declineRequestSchema),
  declineRequest
);
router.patch(
  '/:id/status',
  authorize('technician'),
  validateBody(requestStatusSchema),
  updateRequestStatus
);
router.get('/:id/location', getRequestLocation);
router.post(
  '/:id/location',
  authorize('technician'),
  validateBody(locationCoordinatesSchema),
  startRequestLocation
);
router.patch(
  '/:id/location',
  authorize('technician'),
  validateBody(locationCoordinatesSchema),
  updateRequestLocation
);
router.delete('/:id/location', authorize('technician'), stopRequestLocation);
router.patch(
  '/:id/cancel',
  authorize('customer', 'admin'),
  validateBody(cancelRequestSchema),
  cancelRequest
);
router.patch('/:id', authorize('customer'), validateBody(updateRequestSchema), updateRequest);
router.delete('/:id', authorize('customer', 'admin'), deleteRequest);
router.get('/:id', getRequest);

export default router;