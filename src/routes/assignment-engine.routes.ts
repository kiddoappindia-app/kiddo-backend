import { Router } from 'express';
import * as controller from '../controllers/assignment-engine.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';

const router = Router();

router.use(authenticate);

// Teacher assignment management
router.post('/', authorize('teacher'), controller.createAssignment);
router.patch('/:assignmentId', authorize('teacher'), controller.updateAssignment);
router.post('/:assignmentId/publish', authorize('teacher'), controller.publishAssignment);
router.delete('/:assignmentId', authorize('teacher'), controller.deleteAssignment);
router.get('/teacher', authorize('teacher'), controller.getTeacherAssignments);

// Class assignments
router.get('/class/:classId', controller.getClassAssignments);
router.get('/class/:classId/stats', controller.getAssignmentStats);

// Single assignment
router.get('/:assignmentId', controller.getAssignment);

// Student assignments
router.get('/student/:studentId', controller.getStudentAssignments);
router.post('/:assignmentId/submit', authorize('child'), controller.submitAssignment);

// Grading
router.post('/:assignmentId/grade/:studentId', authorize('teacher'), controller.gradeSubmission);

export default router;
