import { Router } from 'express';
import * as controller from '../controllers/attendance-engine.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Teacher attendance management
router.post('/', authorize('teacher'), controller.markAttendance);
router.post('/finalize', authorize('teacher'), controller.finalizeAttendance);
router.get('/', controller.getAttendance);

// Stats
router.get('/stats/:classId', controller.getAttendanceStats);

// Student attendance
router.get('/student/:studentId', controller.getStudentAttendance);
router.get('/student/:studentId/history', controller.getStudentAttendanceHistory);

export default router;
