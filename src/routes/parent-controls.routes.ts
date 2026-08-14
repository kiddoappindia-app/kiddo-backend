import { Router } from 'express';
import { ParentControlsController } from '../controllers/parent-controls.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/:childId', ParentControlsController.getControls);
router.patch('/:childId', ParentControlsController.updateControls);
router.patch('/:childId/accessibility', ParentControlsController.updateAccessibility);
router.patch('/:childId/feature-toggles', ParentControlsController.updateFeatureToggles);
router.patch('/:childId/store-visibility', ParentControlsController.updateStoreVisibility);
router.patch('/:childId/reward-multipliers', ParentControlsController.updateRewardMultipliers);
router.patch('/:childId/schedule', ParentControlsController.updateSchedule);
router.get('/play-time', ParentControlsController.checkPlayTime);

export default router;
