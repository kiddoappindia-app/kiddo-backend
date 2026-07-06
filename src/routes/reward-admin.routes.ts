import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as adminCtrl from '../controllers/reward-admin.controller.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/rules', adminCtrl.listRules);
router.post('/rules', adminCtrl.createRule);
router.patch('/rules/:id', adminCtrl.updateRule);

router.get('/campaigns', adminCtrl.listCampaigns);
router.post('/campaigns', adminCtrl.createCampaign);
router.patch('/campaigns/:id', adminCtrl.updateCampaign);

router.get('/transactions', adminCtrl.getTransactionLogs);
router.get('/economy/stats', adminCtrl.getEconomyStats);
router.get('/economy/conversions', adminCtrl.getConversionAnalytics);

router.post('/wallet/:userId/adjust', adminCtrl.adjustBalance);
router.post('/wallet/:userId/freeze', adminCtrl.freezeWallet);
router.post('/wallet/:userId/unfreeze', adminCtrl.unfreezeWallet);

export default router;
