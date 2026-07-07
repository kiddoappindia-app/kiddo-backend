import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import * as adminTeacherController from '../controllers/admin-teacher.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));
router.get('/dashboard', adminController.getDashboard);
router.get('/tasks', adminController.moderateTasks);
router.get('/rewards', adminController.moderateRewards);

// Teacher management
router.post('/teachers', adminTeacherController.adminCreateTeacher);
router.get('/teachers', adminTeacherController.adminListTeachers);
router.get('/teachers/:teacherId', adminTeacherController.adminGetTeacher);
router.patch('/teachers/:teacherId/disable', adminTeacherController.adminDisableTeacher);
router.patch('/teachers/:teacherId/enable', adminTeacherController.adminEnableTeacher);
router.post('/teachers/:teacherId/reset-password', adminTeacherController.adminResetTeacherPassword);
router.get('/teachers/:teacherId/classes', adminTeacherController.adminGetTeacherClasses);
router.get('/teachers/:teacherId/students', adminTeacherController.adminGetTeacherStudents);
router.get('/teachers/:teacherId/stats', adminTeacherController.adminGetTeacherStats);

// ── Reward configuration ────────────────────────────────────────────────────
router.patch('/reward-rules/:id', requirePermission(PERMISSIONS.REWARD_RULE_MANAGE), adminController.updateRewardRule);

export default router;
