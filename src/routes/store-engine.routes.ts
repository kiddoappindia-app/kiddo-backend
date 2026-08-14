import { Router } from 'express';
import { StoreController } from '../controllers/store-engine.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/items', StoreController.getItems);
router.post('/items', StoreController.createItem);
router.put('/items/:itemId', StoreController.updateItem);
router.post('/items/:itemId/redeem', StoreController.requestRedemption);
router.post('/redemptions/:redemptionId/approve', StoreController.approveRedemption);
router.post('/redemptions/:redemptionId/fulfill', StoreController.fulfillRedemption);
router.post('/redemptions/:redemptionId/cancel', StoreController.cancelRedemption);
router.get('/child/:childId/redemptions', StoreController.getChildRedemptions);
router.get('/family/redemptions', StoreController.getFamilyRedemptions);
router.get('/stats', StoreController.getStats);

export default router;
