import { Router } from 'express';
import { ContentController } from '../controllers/content.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new ContentController();

router.get('/search', authenticate, ctrl.searchContent);
router.get('/:type', authenticate, ctrl.getContent);
router.get('/:id', authenticate, ctrl.getContentById);
router.post('/', authenticate, ctrl.createContent);
router.put('/:id', authenticate, ctrl.updateContent);
router.post('/:id/publish', authenticate, ctrl.publishContent);
router.post('/:id/archive', authenticate, ctrl.archiveContent);
router.delete('/:id', authenticate, ctrl.deleteContent);
router.get('/:id/versions', authenticate, ctrl.getVersions);
router.post('/:id/revert', authenticate, ctrl.revertToVersion);

export default router;
