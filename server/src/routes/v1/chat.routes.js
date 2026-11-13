import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { imageUploader } from '../../middleware/upload.js';
import { createConversationSchema, messageQuerySchema } from '../../validators/chat.schema.js';
import {
  createConversation,
  getConversation,
  listConversations,
  listMessages,
  readConversation,
  sendMessage,
  unreadCount,
} from '../../controllers/chat.controller.js';

const router = Router();
router.use(authenticate);

router.get('/unread-count', unreadCount);
router.get('/', listConversations);
router.post('/', validateBody(createConversationSchema), createConversation);
router.get('/:id/messages', validateQuery(messageQuerySchema), listMessages);
router.get('/:id', getConversation);
router.post('/:id/messages', imageUploader('chat').single('image'), sendMessage);
router.patch('/:id/read', readConversation);

export default router;