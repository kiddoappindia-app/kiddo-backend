import { Router } from 'express';
import { VirtualHomeController } from '../controllers/virtual-home.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', VirtualHomeController.getHome);
router.get('/furniture', VirtualHomeController.getFurnitureItems);
router.post('/furniture', VirtualHomeController.placeFurniture);
router.delete('/furniture/:roomId/:furnitureId', VirtualHomeController.removeFurniture);
router.post('/unlock-room', VirtualHomeController.unlockRoom);
router.patch('/rename', VirtualHomeController.renameHome);
router.get('/stats', VirtualHomeController.getHomeStats);

export default router;
