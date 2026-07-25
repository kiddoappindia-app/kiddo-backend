import { Router } from 'express';
import * as scheduleController from '../controllers/schedule.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.get('/:childId', authorize(ROLES.PARENT, ROLES.ADMIN), scheduleController.getSchedule);
router.patch('/:childId', authorize(ROLES.PARENT, ROLES.ADMIN), scheduleController.updateSchedule);
router.get('/:childId/wake-up-settings', authorize(ROLES.PARENT, ROLES.ADMIN), scheduleController.getWakeUpSettings);
router.patch('/:childId/wake-up-settings', authorize(ROLES.PARENT, ROLES.ADMIN), scheduleController.updateWakeUpSettings);
router.get('/:childId/today-school-day', authorize(ROLES.PARENT, ROLES.ADMIN, ROLES.CHILD), scheduleController.checkTodaySchoolDay);

export default router;
