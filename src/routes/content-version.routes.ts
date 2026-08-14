import { Router } from 'express';
import { ContentVersionController } from '../controllers/content-version.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new ContentVersionController();

router.get('/drafts', authenticate, ctrl.getDraftVersions);
router.get('/reviews', authenticate, ctrl.getReviewVersions);
router.get('/:contentId', authenticate, ctrl.getVersions);
router.get('/:contentId/:version', authenticate, ctrl.getVersion);
router.post('/', authenticate, ctrl.createVersion);
router.post('/:contentId/:version/review', authenticate, ctrl.reviewVersion);
router.post('/:contentId/:version/publish', authenticate, ctrl.publishVersion);
router.post('/:contentId/:version/revert', authenticate, ctrl.revertToVersion);
router.delete('/:contentId/:version', authenticate, ctrl.deleteVersion);
router.get('/:contentId/stats', authenticate, ctrl.getVersionStats);

export default router;
