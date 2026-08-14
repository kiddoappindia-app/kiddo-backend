import { Router } from 'express';
import * as controller from '../controllers/teacher-analytics.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', authorize('teacher'), controller.getTeacherDashboard);
router.get('/class/:classId', authorize('teacher'), controller.getClassAnalytics);
router.get('/student/:studentId', authorize('teacher'), controller.getStudentProgress);
router.get('/class/:classId/homework-rate', authorize('teacher'), controller.getHomeworkCompletionRate);
router.get('/parent-engagement', authorize('parent'), controller.getParentEngagement);

export default router;
