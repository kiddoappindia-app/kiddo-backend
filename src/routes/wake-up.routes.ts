import { Router } from 'express';
import * as wakeUpController from '../controllers/wake-up.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.post('/:childId/complete', authorize(ROLES.CHILD), wakeUpController.completeWakeUp);
router.get('/:childId/history', authorize(ROLES.PARENT, ROLES.ADMIN, ROLES.CHILD), wakeUpController.getWakeUpHistory);
router.get('/:childId/today', authorize(ROLES.PARENT, ROLES.ADMIN, ROLES.CHILD), wakeUpController.getTodayStatus);

export default router;
