import { Router } from 'express';
import { RemoteConfigController } from '../controllers/remote-config.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new RemoteConfigController();

router.get('/', authenticate, ctrl.getConfigs);
router.get('/client', ctrl.getClientConfig);
router.get('/:key', authenticate, ctrl.getConfig);
router.post('/', authenticate, ctrl.setConfig);
router.delete('/:key', authenticate, ctrl.deleteConfig);
router.get('/:key/changelog', authenticate, ctrl.getChangeLog);

export default router;
