import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import * as walletCtrl from '../controllers/wallet.controller.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

// ── Self-service wallet ─────────────────────────────────────────────────────
router.get('/me', walletCtrl.getMyWallet);
router.get('/transactions', walletCtrl.getTransactions);
router.get('/conversions', walletCtrl.getConversions);

// ── Reward points ───────────────────────────────────────────────────────────
router.post('/reward', authorize(ROLES.CHILD, ROLES.PARENT, ROLES.TEACHER, ROLES.ADMIN), walletCtrl.awardPoints);

// ── Conversion (child) ──────────────────────────────────────────────────────
router.post('/convert', authorize(ROLES.CHILD), walletCtrl.convertPoints);
router.post('/convert/request', authorize(ROLES.CHILD), walletCtrl.requestConversion);

// ── Conversion approval (parent/admin) ──────────────────────────────────────
router.post('/conversions/:id/approve', authorize(ROLES.PARENT, ROLES.ADMIN), requirePermission(PERMISSIONS.CONVERSION_APPROVE), walletCtrl.approveConversion);
router.post('/conversions/:id/reject', authorize(ROLES.PARENT, ROLES.ADMIN), requirePermission(PERMISSIONS.CONVERSION_REJECT), walletCtrl.rejectConversion);
router.get('/conversions/pending', authorize(ROLES.PARENT, ROLES.ADMIN), requirePermission(PERMISSIONS.PARENT_APPROVE), walletCtrl.getPendingConversions);

// ── Gift rewards ────────────────────────────────────────────────────────────
router.post('/gift/points', authorize(ROLES.PARENT, ROLES.TEACHER, ROLES.ADMIN), requirePermission(PERMISSIONS.REWARD_GIFT), walletCtrl.giftPoints);
router.post('/gift/coins', authorize(ROLES.PARENT, ROLES.ADMIN), requirePermission(PERMISSIONS.WALLET_GIFT), walletCtrl.giftCoins);

// ── Spend (child) ───────────────────────────────────────────────────────────
router.post('/spend', authorize(ROLES.CHILD), walletCtrl.spendCoins);

// ── View child wallet (parent/admin) ────────────────────────────────────────
router.get('/child/:childId', authorize(ROLES.PARENT, ROLES.ADMIN), requirePermission(PERMISSIONS.WALLET_VIEW), walletCtrl.getChildWallet);

export default router;
