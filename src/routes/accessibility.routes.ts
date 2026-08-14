import { Router } from 'express';
import { AccessibilityController } from '../controllers/accessibility.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new AccessibilityController();

router.get('/presets/:preset', ctrl.getPreset);
router.get('/user/:userId', authenticate, ctrl.getUserSettings);
router.put('/user/:userId', authenticate, ctrl.setUserSettings);
router.post('/user/:userId/preset', authenticate, ctrl.applyPreset);
router.get('/school/:schoolId', authenticate, ctrl.getSchoolAccessibility);
router.get('/family/:familyId', authenticate, ctrl.getFamilyAccessibility);
router.post('/bulk-preset', authenticate, ctrl.applyBulkPreset);

export default router;
