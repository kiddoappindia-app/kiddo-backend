import { Router } from 'express';
import { FeatureFlagController } from '../controllers/feature-flag.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new FeatureFlagController();

router.get('/', authenticate, ctrl.getFlags);
router.get('/client', ctrl.getClientFlags);
router.get('/:key', authenticate, ctrl.getFlagByKey);
router.post('/', authenticate, ctrl.createFlag);
router.put('/:key', authenticate, ctrl.updateFlag);
router.post('/:key/toggle', authenticate, ctrl.toggleFlag);
router.post('/:key/rollout', authenticate, ctrl.setRollout);
router.delete('/:key', authenticate, ctrl.deleteFlag);
router.get('/:key/changelog', authenticate, ctrl.getChangeLog);

export default router;
