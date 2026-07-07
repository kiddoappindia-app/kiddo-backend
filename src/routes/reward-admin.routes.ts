import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import * as adminCtrl from '../controllers/reward-admin.controller.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// ── Reward rules ────────────────────────────────────────────────────────────
router.get('/rules', requirePermission(PERMISSIONS.REWARD_RULE_MANAGE), adminCtrl.listRules);
router.get('/rules/:id', requirePermission(PERMISSIONS.REWARD_RULE_MANAGE), adminCtrl.getRule);
router.post('/rules', requirePermission(PERMISSIONS.REWARD_RULE_MANAGE), adminCtrl.createRule);
router.patch('/rules/:id', requirePermission(PERMISSIONS.REWARD_RULE_MANAGE), adminCtrl.updateRule);
router.delete('/rules/:id', requirePermission(PERMISSIONS.REWARD_RULE_MANAGE), adminCtrl.deleteRule);

// ── Campaigns ───────────────────────────────────────────────────────────────
router.get('/campaigns', requirePermission(PERMISSIONS.CAMPAIGN_MANAGE), adminCtrl.listCampaigns);
router.get('/campaigns/:id', requirePermission(PERMISSIONS.CAMPAIGN_MANAGE), adminCtrl.getCampaign);
router.post('/campaigns', requirePermission(PERMISSIONS.CAMPAIGN_CREATE), adminCtrl.createCampaign);
router.patch('/campaigns/:id', requirePermission(PERMISSIONS.CAMPAIGN_EDIT), adminCtrl.updateCampaign);
router.delete('/campaigns/:id', requirePermission(PERMISSIONS.CAMPAIGN_DELETE), adminCtrl.deleteCampaign);
router.post('/campaigns/:id/enable', requirePermission(PERMISSIONS.CAMPAIGN_EDIT), adminCtrl.enableCampaign);
router.post('/campaigns/:id/disable', requirePermission(PERMISSIONS.CAMPAIGN_EDIT), adminCtrl.disableCampaign);
router.post('/campaigns/:id/archive', requirePermission(PERMISSIONS.CAMPAIGN_ARCHIVE), adminCtrl.archiveCampaign);
router.post('/campaigns/:id/duplicate', requirePermission(PERMISSIONS.CAMPAIGN_DUPLICATE), adminCtrl.duplicateCampaign);
router.post('/campaigns/:id/restore', requirePermission(PERMISSIONS.CAMPAIGN_RESTORE), adminCtrl.restoreCampaign);

// ── Transaction logs ────────────────────────────────────────────────────────
router.get('/transactions', requirePermission(PERMISSIONS.TRANSACTION_VIEW), adminCtrl.getTransactionLogs);
router.get('/transactions/:id', requirePermission(PERMISSIONS.TRANSACTION_VIEW), adminCtrl.getTransactionDetail);

// ── Economy stats ───────────────────────────────────────────────────────────
router.get('/economy/stats', requirePermission(PERMISSIONS.ECONOMY_VIEW), adminCtrl.getEconomyStats);
router.get('/economy/conversions', requirePermission(PERMISSIONS.ANALYTICS_VIEW), adminCtrl.getConversionAnalytics);

// ── Wallet management ───────────────────────────────────────────────────────
router.post('/wallet/:userId/adjust', requirePermission(PERMISSIONS.WALLET_ADJUST), adminCtrl.adjustBalance);
router.post('/wallet/:userId/freeze', requirePermission(PERMISSIONS.WALLET_FREEZE), adminCtrl.freezeWallet);
router.post('/wallet/:userId/unfreeze', requirePermission(PERMISSIONS.WALLET_FREEZE), adminCtrl.unfreezeWallet);
router.post('/wallet/:userId/refund', requirePermission(PERMISSIONS.WALLET_REFUND), adminCtrl.refundCoins);

export default router;
