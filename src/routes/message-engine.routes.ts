import { Router } from 'express';
import * as controller from '../controllers/message-engine.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', controller.sendMessage);
router.get('/conversations', controller.getConversations);
router.get('/unread', controller.getUnreadCount);
router.get('/:userId', controller.getConversation);
router.post('/:messageId/read', controller.markAsRead);
router.post('/read/:userId', controller.markConversationAsRead);
router.get('/student/:studentId', controller.getStudentMessages);

export default router;
