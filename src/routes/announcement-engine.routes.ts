import { Router } from 'express';
import * as controller from '../controllers/announcement-engine.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Teacher announcement management
router.post('/', authorize('teacher'), controller.createAnnouncement);
router.patch('/:announcementId', authorize('teacher'), controller.updateAnnouncement);
router.post('/:announcementId/publish', authorize('teacher'), controller.publishAnnouncement);
router.delete('/:announcementId', authorize('teacher'), controller.deleteAnnouncement);
router.get('/teacher', authorize('teacher'), controller.getTeacherAnnouncements);

// School announcements
router.get('/school/:schoolId', controller.getAnnouncements);

// Student announcements
router.get('/student', authorize('child'), controller.getStudentAnnouncements);

// Parent announcements
router.get('/parent', authorize('parent'), controller.getParentAnnouncements);

// Acknowledgement
router.post('/:announcementId/acknowledge', controller.acknowledgeAnnouncement);

export default router;
