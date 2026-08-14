import { Router } from 'express';
import * as controller from '../controllers/school-reward-engine.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Teacher awarding
router.post('/stars', authorize('teacher'), controller.awardStars);
router.post('/certificates', authorize('teacher'), controller.awardCertificate);
router.post('/badges', authorize('teacher'), controller.awardBadge);
router.post('/recognition', authorize('teacher'), controller.awardRecognition);
router.post('/participation', authorize('teacher'), controller.awardParticipation);

// Teacher awards history
router.get('/teacher', authorize('teacher'), controller.getTeacherAwards);

// Student rewards
router.get('/student/:studentId', controller.getStudentRewards);
router.get('/student/:studentId/pending', controller.getPendingConversions);

// Parent conversion
router.post('/:rewardId/approve', authorize('parent'), controller.approveConversion);

// Stats
router.get('/school/:schoolId/stats', controller.getSchoolRewardStats);

export default router;
