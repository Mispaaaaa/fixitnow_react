import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { imageUploader } from '../../middleware/upload.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../../validators/auth.schema.js';
import {
  register,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  uploadAvatar,
  changePassword,
} from '../../controllers/auth.controller.js';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateProfile);
router.post(
  '/me/avatar',
  authenticate,
  imageUploader('avatars').single('avatar'),
  uploadAvatar
);
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  changePassword
);

export default router;