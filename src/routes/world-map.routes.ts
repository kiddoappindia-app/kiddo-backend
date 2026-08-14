import { Router } from 'express';
import { WorldMapController } from '../controllers/world-map.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/areas', WorldMapController.getAllAreas);
router.get('/areas/:areaId', WorldMapController.getArea);

router.use(authenticate);

router.get('/progress', WorldMapController.getMyProgress);
router.post('/travel', WorldMapController.travel);
router.post('/collect', WorldMapController.collectCollectible);
router.post('/interact-npc', WorldMapController.interactNpc);
router.get('/stats', WorldMapController.getWorldStats);

export default router;
