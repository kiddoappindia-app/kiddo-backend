import { Router } from 'express';
import { AnnouncementCmsController } from '../controllers/announcement-cms.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new AnnouncementCmsController();

router.get('/', authenticate, ctrl.getAnnouncements);
router.get('/active', ctrl.getActive);
router.post('/publish-scheduled', authenticate, ctrl.publishScheduled);
router.get('/:id', authenticate, ctrl.getAnnouncementById);
router.post('/', authenticate, ctrl.createAnnouncement);
router.put('/:id', authenticate, ctrl.updateAnnouncement);
router.post('/:id/publish', authenticate, ctrl.publishAnnouncement);
router.post('/:id/schedule', authenticate, ctrl.scheduleAnnouncement);
router.post('/:id/acknowledge', authenticate, ctrl.acknowledge);
router.delete('/:id', authenticate, ctrl.deleteAnnouncement);

export default router;
