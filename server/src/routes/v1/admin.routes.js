import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import {
  adminListSchema,
  announcementSchema,
  categorySchema,
  categoryUpdateSchema,
  contentSchema,
  requestAssignmentSchema,
  reviewVisibilitySchema,
  userStatusSchema,
  verificationDecisionSchema,
} from '../../validators/admin.schema.js';
import {
  assignAdminRequest,
  createAdminAnnouncement,
  createAdminCategory,
  decideVerification,
  deleteAdminCategory,
  getAdminContent,
  getVerificationDocument,
  listAdminAnnouncements,
  listAdminArchive,
  listAdminAudit,
  listAdminCategories,
  listAdminRequests,
  listAdminReviews,
  listAdminUsers,
  listVerificationQueue,
  restoreAdminArchive,
  updateAdminAnnouncement,
  updateAdminCategory,
  updateAdminContent,
  updateReviewVisibility,
  updateUserStatus,
} from '../../controllers/admin.controller.js';

const router = Router();
router.use(authenticate, authorize('admin'));

router.get('/requests', validateQuery(adminListSchema), listAdminRequests);
router.patch('/requests/:id/assignment', validateBody(requestAssignmentSchema), assignAdminRequest);
router.get('/verification', validateQuery(adminListSchema), listVerificationQueue);
router.patch('/verification/:id', validateBody(verificationDecisionSchema), decideVerification);
router.get('/verification/:profileId/documents/:documentId', getVerificationDocument);
router.get('/users', validateQuery(adminListSchema), listAdminUsers);
router.patch('/users/:id/status', validateBody(userStatusSchema), updateUserStatus);
router.get('/reviews', validateQuery(adminListSchema), listAdminReviews);
router.patch('/reviews/:id/visibility', validateBody(reviewVisibilitySchema), updateReviewVisibility);
router.get('/categories', listAdminCategories);
router.post('/categories', validateBody(categorySchema), createAdminCategory);
router.patch('/categories/:id', validateBody(categoryUpdateSchema), updateAdminCategory);
router.delete('/categories/:id', deleteAdminCategory);
router.get('/content/:key', getAdminContent);
router.put('/content/:key', validateBody(contentSchema), updateAdminContent);
router.get('/announcements', listAdminAnnouncements);
router.post('/announcements', validateBody(announcementSchema), createAdminAnnouncement);
router.patch('/announcements/:id', validateBody(announcementSchema.partial()), updateAdminAnnouncement);
router.get('/archive', validateQuery(adminListSchema), listAdminArchive);
router.post('/archive/:type/:id/restore', restoreAdminArchive);
router.get('/audit', validateQuery(adminListSchema), listAdminAudit);

export default router;
