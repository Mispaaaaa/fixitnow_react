import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
  deleteNotification,
} from '../../controllers/notification.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', listNotifications);
router.get('/unread-count', unreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/:id', deleteNotification);

export default router;