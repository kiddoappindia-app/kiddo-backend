import { Router } from 'express';
import * as teacherController from '../controllers/teacher.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public routes
router.post('/activate', teacherController.activateTeacher);
router.post('/login', teacherController.teacherLogin);

// Protected routes
router.use(authenticate);

// Teacher self-service
router.get('/profile', authorize(ROLES.TEACHER), teacherController.getTeacherProfile);
router.patch('/profile', authorize(ROLES.TEACHER), teacherController.updateTeacherProfile);
router.get('/dashboard', authorize(ROLES.TEACHER), teacherController.getTeacherDashboard);

// Class management
router.get('/classes', authorize(ROLES.TEACHER), teacherController.getTeacherClasses);
router.post('/classes', authorize(ROLES.TEACHER), teacherController.createClass);
router.patch('/classes/:classId', authorize(ROLES.TEACHER), teacherController.updateClass);
router.delete('/classes/:classId', authorize(ROLES.TEACHER), teacherController.archiveClass);

// Student management
router.get('/classes/:classId/students', authorize(ROLES.TEACHER), teacherController.getClassStudents);
router.post('/classes/:classId/students', authorize(ROLES.TEACHER), teacherController.addStudentToClass);
router.post('/classes/:classId/invite', authorize(ROLES.TEACHER), teacherController.inviteStudentByCode);
router.delete('/classes/:classId/students/:childId', authorize(ROLES.TEACHER), teacherController.removeStudentFromClass);

// Task management
router.post('/tasks', authorize(ROLES.TEACHER), teacherController.createTeacherTask);

// Rewards
router.post('/bonus', authorize(ROLES.TEACHER), requirePermission(PERMISSIONS.TEACHER_REWARD), teacherController.awardBonusPoints);
router.post('/badges', authorize(ROLES.TEACHER), teacherController.awardBadge);

// Specific award actions
router.post('/award/attendance', authorize(ROLES.TEACHER), requirePermission(PERMISSIONS.TEACHER_AWARD_ATTENDANCE), teacherController.awardAttendance);
router.post('/award/homework', authorize(ROLES.TEACHER), requirePermission(PERMISSIONS.TEACHER_AWARD_HOMEWORK), teacherController.awardHomework);
router.post('/award/quiz', authorize(ROLES.TEACHER), requirePermission(PERMISSIONS.TEACHER_AWARD_QUIZ), teacherController.awardQuiz);
router.post('/award/behaviour', authorize(ROLES.TEACHER), requirePermission(PERMISSIONS.TEACHER_AWARD_BEHAVIOUR), teacherController.awardBehaviour);
router.post('/award/participation', authorize(ROLES.TEACHER), requirePermission(PERMISSIONS.TEACHER_AWARD_PARTICIPATION), teacherController.awardParticipation);
router.post('/award/reading', authorize(ROLES.TEACHER), requirePermission(PERMISSIONS.TEACHER_AWARD_READING), teacherController.awardReading);
router.post('/award/challenge', authorize(ROLES.TEACHER), requirePermission(PERMISSIONS.TEACHER_AWARD_CHALLENGE), teacherController.awardChallenge);

// Leaderboard
router.get('/leaderboard/:classId', authorize(ROLES.TEACHER, ROLES.PARENT, ROLES.CHILD), teacherController.getClassLeaderboard);
router.get('/leaderboard', authorize(ROLES.TEACHER, ROLES.PARENT), teacherController.getSchoolLeaderboard);

// Child teacher info
router.get('/my-teacher', authorize(ROLES.CHILD), teacherController.getChildTeacherInfo);

export default router;
