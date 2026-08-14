import { Router } from 'express';
import * as controller from '../controllers/school-structure.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';

const router = Router();

router.use(authenticate);

// School management
router.post('/', requirePermission('school.create' as any), controller.createSchool);
router.get('/:schoolId', controller.getSchool);
router.patch('/:schoolId', requirePermission('school.update' as any), controller.updateSchool);

// Academic years
router.post('/:schoolId/academic-years', requirePermission('school.manage_years' as any), controller.createAcademicYear);
router.get('/:schoolId/academic-years/active', controller.getActiveAcademicYear);

// Grades
router.post('/:schoolId/grades', requirePermission('school.manage_grades' as any), controller.createGrade);
router.get('/:schoolId/grades', controller.getGrades);

// Sections
router.post('/:schoolId/grades/:gradeId/sections', requirePermission('school.manage_sections' as any), controller.createSection);
router.get('/grades/:gradeId/sections', controller.getSections);

// Subjects
router.post('/:schoolId/subjects', requirePermission('school.manage_subjects' as any), controller.createSubject);
router.get('/:schoolId/subjects', controller.getSubjects);

// Classes
router.post('/classes', requirePermission('school.manage_classes' as any), controller.createClass);
router.get('/my-classes', controller.getTeacherClasses);
router.get('/classes/:classId/students', controller.getClassStudents);
router.post('/classes/:classId/students', requirePermission('school.manage_students' as any), controller.addStudentToClass);
router.delete('/classes/:classId/students/:childId', requirePermission('school.manage_students' as any), controller.removeStudentFromClass);
router.post('/classes/:classId/assign-teacher', requirePermission('school.manage_teachers' as any), controller.assignTeacherToClass);

// Stats
router.get('/:schoolId/stats', controller.getSchoolStats);

export default router;
