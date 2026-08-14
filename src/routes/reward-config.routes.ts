import { Router } from 'express';
import { RewardConfigController } from '../controllers/reward-config.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new RewardConfigController();

router.get('/', authenticate, ctrl.getConfigs);
router.get('/active', ctrl.getActive);
router.get('/:key', authenticate, ctrl.getConfigByKey);
router.post('/', authenticate, ctrl.createConfig);
router.put('/:key', authenticate, ctrl.updateConfig);
router.delete('/:key', authenticate, ctrl.deleteConfig);
router.post('/:key/toggle', authenticate, ctrl.toggleConfig);
router.post('/:key/calculate', authenticate, ctrl.calculateReward);

export default router;
